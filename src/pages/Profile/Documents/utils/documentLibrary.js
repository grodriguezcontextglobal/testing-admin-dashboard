import { isDocumentExpired } from "./documentExpirationUtils";

/**
 * The company's document library, organised by what each document is for
 * (D1 + D2), and which documents can still be handed out (2b.8).
 *
 * Profile → Documents listed everything flat, although every document and
 * every folder already carries `trigger_action`. And an expired document could
 * still be assigned on any screen — meeting 2026-09-29 `37:36`: "an expired
 * document… you should not be able to use it anywhere… but here it should be
 * labeled as expired", and kept, so it can be edited or deleted.
 *
 * Documents and folders keep separate vocabularies on purpose: see
 * folderForm.js, two pickers read the folder values as they are.
 */

const OTHER = { id: "other", label: "Other" };
const UNSET = { id: "unset", label: "Not set" };

/** Lists in circulation spell the date both ways. */
const expirationOf = (document) => document?.expiration_date ?? document?.expirationDate ?? null;

export const isExpiredDocument = (document, now = new Date()) =>
  isDocumentExpired(expirationOf(document), now);

const useOf = (document, uses) => {
  const value = `${document?.trigger_action ?? ""}`.trim();
  return uses.some((use) => use.id === value) ? value : OTHER.id;
};

/**
 * @param {object[]} documents
 * @param {Array<{id: string, label: string}>} uses the company's "Uses for" options
 * @returns {Array<{id, label, documents, expiredCount}>} non-empty groups, in the uses' order, Other last
 */
export const groupDocumentsByUse = (documents = [], uses = [], now = new Date()) =>
  [...uses, OTHER]
    .map((use) => {
      const inUse = documents.filter((document) => useOf(document, uses) === use.id);
      return {
        id: use.id,
        label: use.label,
        documents: inUse,
        expiredCount: inUse.filter((document) => isExpiredDocument(document, now)).length,
      };
    })
    .filter((group) => group.documents.length > 0);

/**
 * @param {string} filter "all", "expired", "other" or a use id
 */
export const filterDocuments = (documents = [], filter = "all", now = new Date(), uses = []) => {
  if (filter === "all") return documents;
  if (filter === "expired") return documents.filter((document) => isExpiredDocument(document, now));
  if (filter === OTHER.id) return documents.filter((document) => useOf(document, uses) === OTHER.id);
  return documents.filter((document) => `${document?.trigger_action ?? ""}`.trim() === filter);
};

/** The number behind every filter: all, each use, other, expired. */
export const documentUseCounts = (documents = [], uses = [], now = new Date()) => {
  const counts = { all: documents.length };
  for (const use of uses) {
    counts[use.id] = documents.filter((document) => useOf(document, uses) === use.id).length;
  }
  counts[OTHER.id] = documents.filter((document) => useOf(document, uses) === OTHER.id).length;
  counts.expired = documents.filter((document) => isExpiredDocument(document, now)).length;
  return counts;
};

/** What may still be assigned: everything that has not expired. */
export const assignableDocuments = (documents = [], now = new Date()) =>
  (documents ?? []).filter((document) => !isExpiredDocument(document, now));

/**
 * Folders under the action they are shown at, by either spelling of the field.
 *
 * @param {Array<{id: string, label: string}>} triggers FOLDER_TRIGGER_ACTIONS
 */
export const groupFoldersByTrigger = (folders = [], triggers = []) => {
  const triggerOf = (folder) => {
    const value = `${folder?.folder_trigger_action ?? folder?.trigger_action ?? ""}`.trim();
    return triggers.some((trigger) => trigger.id === value) ? value : UNSET.id;
  };
  return [...triggers, UNSET]
    .map((trigger) => ({
      id: trigger.id,
      label: trigger.label,
      folders: folders.filter((folder) => triggerOf(folder) === trigger.id),
    }))
    .filter((group) => group.folders.length > 0);
};
