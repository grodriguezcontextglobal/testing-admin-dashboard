import { describe, expect, it } from "vitest";
import {
  assignableDocuments,
  documentsForContext,
  documentUseCounts,
  filterDocuments,
  groupDocumentsByUse,
  groupFoldersByTrigger,
} from "./documentLibrary";

/**
 * D1 + D2 + 2b.8. Profile → Documents listed every document and folder flat,
 * although each one already says what it is for in `trigger_action`; and an
 * expired document could still be assigned anywhere (meeting 2026-09-29
 * `35:04`–`38:33`): "an expired document… you should not be able to use it
 * anywhere… but here it should be labeled as expired".
 */

const NOW = new Date("2026-10-01T12:00:00Z");
const doc = (id, trigger_action, expiration_date = null) => ({
  _id: id,
  title: `Doc ${id}`,
  trigger_action,
  expiration_date,
});

const docs = [
  doc("w", "event", "2026-12-12T00:00:00Z"),
  doc("old", "event", "2026-09-01T00:00:00Z"),
  doc("hb", "onboarding"),
  doc("c", "school_consent"),
  doc("x", "legacy_thing"),
  doc("none", undefined),
];

const uses = [
  { id: "onboarding", label: "Staff" },
  { id: "event", label: "Event" },
  { id: "consumer", label: "Consumer" },
  { id: "school_consent", label: "School consent" },
];

describe("groupDocumentsByUse", () => {
  const groups = groupDocumentsByUse(docs, uses, NOW);

  it("puts each document under the use it was uploaded for, in the form's order", () => {
    expect(groups.map((group) => group.id)).toEqual([
      "onboarding",
      "event",
      "school_consent",
      "other",
    ]);
    expect(groups.find((g) => g.id === "event").documents.map((d) => d._id)).toEqual(["w", "old"]);
  });

  it("does not show an empty use", () => {
    expect(groups.some((g) => g.id === "consumer")).toBe(false);
  });

  /* A value the company's form no longer offers, or none at all, still has to
     be findable — not vanish because it fits no heading. */
  it("gathers unknown and missing uses under Other", () => {
    const other = groups.find((g) => g.id === "other");
    expect(other.label).toBe("Other");
    expect(other.documents.map((d) => d._id)).toEqual(["x", "none"]);
  });

  it("counts the expired ones in each use", () => {
    expect(groups.find((g) => g.id === "event").expiredCount).toBe(1);
  });
});

describe("filterDocuments", () => {
  it("is everything for All", () => {
    expect(filterDocuments(docs, "all", NOW)).toHaveLength(docs.length);
  });

  it("is one use", () => {
    expect(filterDocuments(docs, "event", NOW).map((d) => d._id)).toEqual(["w", "old"]);
  });

  it("is the expired ones, across uses", () => {
    expect(filterDocuments(docs, "expired", NOW).map((d) => d._id)).toEqual(["old"]);
  });

  it("is Other for unknown and missing uses", () => {
    expect(filterDocuments(docs, "other", NOW, uses).map((d) => d._id)).toEqual(["x", "none"]);
  });
});

describe("documentUseCounts", () => {
  it("gives the number behind each filter", () => {
    expect(documentUseCounts(docs, uses, NOW)).toEqual({
      all: 6,
      onboarding: 1,
      event: 2,
      consumer: 0,
      school_consent: 1,
      other: 2,
      expired: 1,
    });
  });
});

/* 2b.8: "an expired document… you should not be able to use it anywhere". */
describe("assignableDocuments", () => {
  it("leaves out the expired ones", () => {
    expect(assignableDocuments(docs, NOW).map((d) => d._id)).toEqual([
      "w",
      "hb",
      "c",
      "x",
      "none",
    ]);
  });

  it("reads the date from either field a list carries", () => {
    const shapes = [{ _id: "a", expiration_date: "2020-01-01" }, { id: "b", expirationDate: "2020-01-01" }];
    expect(assignableDocuments(shapes, NOW)).toEqual([]);
  });
});

/* Folders have their own vocabulary (folderForm.js explains why it is not
   merged with the document one). */
describe("groupFoldersByTrigger", () => {
  const triggers = [
    { id: "equipment_assignment", label: "Equipment Assignment to Staff" },
    { id: "consumer_checkout", label: "Consumer Device Checkout" },
  ];

  it("groups by either spelling of the field, and gathers the rest under Not set", () => {
    const groups = groupFoldersByTrigger(
      [
        { folder_id: 1, folder_trigger_action: "equipment_assignment" },
        { folder_id: 2, trigger_action: "consumer_checkout" },
        { folder_id: 3 },
      ],
      triggers
    );
    expect(groups.map((g) => [g.id, g.folders.map((f) => f.folder_id)])).toEqual([
      ["equipment_assignment", [1]],
      ["consumer_checkout", [2]],
      ["unset", [3]],
    ]);
    expect(groups.at(-1).label).toBe("Not set");
  });
});

/**
 * Each picker offers only the documents meant for it (2026-10-05): event
 * documents only on event screens, staff documents (`onboarding`) on every
 * staff action that asks for documents, school consent documents only in the
 * student consent flow (Education), and the rest — consumer, the industry's
 * own use such as "Students" — on the member handover. A document with no use
 * at all predates the field and cannot be edited yet (no edit route), so it
 * stays available everywhere rather than vanish — except in the consent flow.
 */
describe("documentsForContext", () => {
  const docs = [
    { _id: "e", trigger_action: "event" },
    { _id: "s", trigger_action: "onboarding" },
    { _id: "c", trigger_action: "consumer" },
    { _id: "sc", trigger_action: "school_consent" },
    { _id: "i", trigger_action: "Student" },
    { _id: "legacy" },
    { _id: "blank", trigger_action: "  " },
  ];
  const ids = (list) => list.map((doc) => doc._id);

  it("offers only event documents on event screens", () => {
    expect(ids(documentsForContext(docs, "event"))).toEqual(["e", "legacy", "blank"]);
  });

  it("offers only staff documents on staff actions", () => {
    expect(ids(documentsForContext(docs, "staff"))).toEqual(["s", "legacy", "blank"]);
  });

  it("offers a member everything that is neither event, staff nor school consent", () => {
    expect(ids(documentsForContext(docs, "member"))).toEqual(["c", "i", "legacy", "blank"]);
  });

  /* Consent documents are served to guardians without a login: only what was
     marked for it, never a document whose use nobody set. */
  it("offers the consent flow only school consent documents, no legacy ones", () => {
    expect(ids(documentsForContext(docs, "school"))).toEqual(["sc"]);
  });

  it("reads the use whatever its spacing or case", () => {
    expect(ids(documentsForContext([{ _id: "x", trigger_action: " Event " }], "staff"))).toEqual(
      []
    );
  });

  it("leaves the list alone without a context, and copes with no list", () => {
    expect(documentsForContext(docs)).toHaveLength(docs.length);
    expect(documentsForContext(undefined, "event")).toEqual([]);
  });
});
