import { describe, expect, it } from "vitest";
import { assignDocument, isFileDrag, unassignedDocuments } from "./documentAssignment";

/**
 * The documents step of the new-event wizard (meeting 2026-09-29 `33:01`–
 * `42:18`). Drag, and now click, move a company document from "available" to
 * "assigned"; both go through assignDocument so they cannot disagree.
 */
const waiver = { _id: "d1", title: "Waiver form", document_url: "https://docs/d1" };
const flyer = { _id: "d2", title: "Flyer", document_url: "https://docs/d2" };

describe("assignDocument", () => {
  it("adds a document in the shape the event stores", () => {
    expect(assignDocument([], waiver)).toEqual({
      list: [{ id: "d1", title: "Waiver form", view_url: "https://docs/d1" }],
      outcome: "assigned",
    });
  });

  it("leaves the list as it was when the document is already assigned", () => {
    const list = [{ id: "d1", title: "Waiver form", view_url: "https://docs/d1" }];
    expect(assignDocument(list, waiver)).toEqual({ list, outcome: "duplicate" });
  });

  it("says so when there is no document to assign", () => {
    expect(assignDocument([], undefined)).toEqual({ list: [], outcome: "missing" });
  });
});

describe("unassignedDocuments", () => {
  it("is what is available minus what is assigned", () => {
    const assigned = [{ id: "d1" }];
    expect(unassignedDocuments([waiver, flyer], assigned)).toEqual([flyer]);
  });

  it("is empty while nothing has loaded", () => {
    expect(unassignedDocuments(undefined, [])).toEqual([]);
  });
});

/* He dragged a PDF from his desktop onto the zone (`33:01`). A browser that
   receives a file drop it does not handle opens the file — leaving the
   wizard. A drag that carries files is told apart from a document being moved
   between the two lists. */
describe("isFileDrag", () => {
  it("recognises a drag carrying files from the computer", () => {
    expect(isFileDrag({ types: ["Files"] })).toBe(true);
  });

  it("does not mistake anything else for one", () => {
    expect(isFileDrag({ types: ["text/plain"] })).toBe(false);
    expect(isFileDrag(null)).toBe(false);
    expect(isFileDrag({})).toBe(false);
  });
});

/* 2b.8 (meeting 2026-09-29 `37:36`): "an expired document… you should not
   be able to use it anywhere". The board still lists it — marked — but it
   cannot be put on the event. */
describe("assignDocument — expired documents", () => {
  const NOW = new Date("2026-10-01T12:00:00Z");
  const expired = { _id: "old", title: "Old waiver", document_url: "u", expiration_date: "2026-09-01" };

  it("refuses an expired document", () => {
    expect(assignDocument([], expired, NOW)).toEqual({ list: [], outcome: "expired" });
  });

  it("still assigns one that expires later", () => {
    expect(
      assignDocument([], { ...expired, expiration_date: "2099-01-01" }, NOW).outcome
    ).toBe("assigned");
  });
});
