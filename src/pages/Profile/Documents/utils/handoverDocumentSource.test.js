import { describe, expect, it } from "vitest";
import { handoverDocumentSource } from "./handoverDocumentSource";

/**
 * The documents emailed with an equipment handover to a member. A company can
 * pin them to its equipment-assignment folder; otherwise they are picked from
 * the library. Either way an expired one must not be sent (2b.8, meeting
 * 2026-09-29 `37:36`). Folder entries carry no expiration of their own, so it
 * is read from the library record with the same id.
 */
const NOW = new Date("2026-10-01T12:00:00Z");
const library = [
  { _id: "w", title: "Waiver form", document_url: "u-w", expiration_date: "2099-01-01" },
  { _id: "old", title: "Old waiver", document_url: "u-o", expiration_date: "2020-01-01" },
];
const folder = (documents) => ({ folder_trigger_action: "equipment_assignment", documents });

describe("handoverDocumentSource — from the folder", () => {
  const source = handoverDocumentSource({
    folders: [
      folder([
        { document_id: "w", document_title: "Waiver form", document_url: "u-w" },
        { document_id: "old", document_title: "Old waiver", document_url: "u-o" },
      ]),
    ],
    libraryDocuments: library,
    now: NOW,
  });

  it("attaches only the documents that have not expired", () => {
    expect(source.fromFolder).toBe(true);
    expect(source.documents).toEqual([{ id: "w", title: "Waiver form", view_url: "u-w" }]);
  });

  it("names the expired ones it left out, so it can be said", () => {
    expect(source.skippedExpired).toEqual(["Old waiver"]);
  });

  it("ignores folders for other actions", () => {
    expect(
      handoverDocumentSource({
        folders: [{ folder_trigger_action: "consumer_checkout", documents: [{ document_id: "w" }] }],
        libraryDocuments: library,
        now: NOW,
      }).fromFolder
    ).toBe(false);
  });
});

describe("handoverDocumentSource — from the library", () => {
  const source = handoverDocumentSource({ folders: [], libraryDocuments: library, now: NOW });

  it("offers the library, marking the expired ones", () => {
    expect(source.fromFolder).toBe(false);
    expect(source.documents).toEqual([
      { id: "w", title: "Waiver form", view_url: "u-w", expired: false },
      { id: "old", title: "Old waiver", view_url: "u-o", expired: true },
    ]);
  });
});
