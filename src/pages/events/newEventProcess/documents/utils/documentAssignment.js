/**
 * Moving company documents onto a new event (documents step of the wizard).
 * Dragging and the Assign button both go through `assignDocument`, so the two
 * ways in cannot disagree about what "assigned" means.
 */

/**
 * @param {Array<{id: string}>} assigned what the event already carries
 * @param {{_id: string, title: string, document_url: string}|undefined} doc
 * @returns {{ list: object[], outcome: "assigned"|"duplicate"|"missing" }}
 */
export const assignDocument = (assigned = [], doc) => {
  if (!doc) return { list: assigned, outcome: "missing" };
  if (assigned.some((entry) => entry.id === doc._id)) {
    return { list: assigned, outcome: "duplicate" };
  }
  return {
    list: [...assigned, { id: doc._id, title: doc.title, view_url: doc.document_url }],
    outcome: "assigned",
  };
};

/** The company's documents that are not on the event yet. */
export const unassignedDocuments = (available = [], assigned = []) =>
  (available ?? []).filter((doc) => !assigned.some((entry) => entry.id === doc._id));

/**
 * Whether a native drag carries files from the computer, as opposed to a
 * document being moved between the two lists (which dnd-kit handles without a
 * native drag at all). Dropping one the page does not handle makes the browser
 * open the file and leave the wizard — reported 2026-09-29 `33:01`.
 *
 * @param {{types?: Iterable<string>}|null} dataTransfer
 */
export const isFileDrag = (dataTransfer) =>
  Array.from(dataTransfer?.types ?? []).includes("Files");
