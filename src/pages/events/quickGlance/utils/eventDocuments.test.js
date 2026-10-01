import { describe, expect, it } from "vitest";
import { addDocumentsToEvent, eventDocumentOptions } from "./eventDocuments";

/**
 * Adding documents to an event from its quick-glance page.
 *
 * Two bugs lived here, both comparing `_id` on entries that carry `id`
 * (legal_documents_list is `{ id, title, view_url }`): `undefined ===
 * undefined`, so the picker kept offering documents already on the event, and
 * — worse — adding to an event that already had one document silently added
 * nothing. And an expired document could be added (2b.8).
 */
const NOW = new Date("2026-10-01T12:00:00Z");
const library = [
  { _id: "w", title: "Waiver form", document_url: "u-w", expiration_date: "2099-01-01" },
  { _id: "f", title: "Flyer", document_url: "u-f" },
  { _id: "old", title: "Old waiver", document_url: "u-o", expiration_date: "2020-01-01" },
];
const onEvent = [{ id: "w", title: "Waiver form", view_url: "u-w" }];

describe("eventDocumentOptions", () => {
  it("does not offer a document the event already has", () => {
    expect(eventDocumentOptions(library, onEvent, NOW).map((o) => o.value)).toEqual(["f", "old"]);
  });

  it("offers an expired one disabled, and says why", () => {
    expect(eventDocumentOptions(library, onEvent, NOW).find((o) => o.value === "old")).toEqual({
      value: "old",
      label: "Old waiver — Expired",
      disabled: true,
    });
  });
});

describe("addDocumentsToEvent", () => {
  it("adds to an event that already has documents", () => {
    expect(addDocumentsToEvent(onEvent, [library[1]], NOW)).toEqual([
      ...onEvent,
      { id: "f", title: "Flyer", view_url: "u-f" },
    ]);
  });

  it("never adds a document twice", () => {
    expect(addDocumentsToEvent(onEvent, [library[0]], NOW)).toEqual(onEvent);
  });

  it("never adds an expired one", () => {
    expect(addDocumentsToEvent(onEvent, [library[2]], NOW)).toEqual(onEvent);
  });
});
