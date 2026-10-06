import { documentsForContext, isExpiredDocument } from "./documentLibrary";

/**
 * The documents emailed with an equipment handover — to a member
 * (ContractDocumentsPicker) or to a staff member (LegalDocumentModal), which
 * used to work this out separately.
 *
 * A company can pin them to its equipment-assignment folder — then those are
 * the documents, and the library picker is not offered. Otherwise they are
 * picked from the library. Either way an expired document is not sent (2b.8,
 * meeting 2026-09-29 `37:36`: "you should not be able to use it anywhere").
 * Folder entries carry no expiration of their own, so it is read from the
 * library record with the same id.
 *
 * Both handovers share that folder and the library, so each offers only its
 * own documents (`context`, 2026-10-05): a staff handover never a member's
 * waiver, neither of them an event's. A folder entry's use is also read from
 * its library record. If the folder holds nothing for this handover, the
 * library picker is offered instead.
 *
 * @returns {{
 *   fromFolder: boolean,
 *   documents: Array<{id, title, view_url, expired?}>,
 *   skippedExpired: string[],
 * }}
 */
export const handoverDocumentSource = ({
  folders = [],
  libraryDocuments = [],
  context,
  now = new Date(),
}) => {
  const libraryById = new Map((libraryDocuments ?? []).map((doc) => [doc._id, doc]));
  const expired = (id) => isExpiredDocument(libraryById.get(id), now);
  const forThisHandover = (id) =>
    documentsForContext([libraryById.get(id) ?? {}], context).length > 0;

  const pinned = (folders ?? [])
    .filter((folder) => folder.folder_trigger_action === "equipment_assignment")
    .flatMap((folder) => folder.documents ?? [])
    .filter((doc) => forThisHandover(doc.document_id));

  if (pinned.length > 0) {
    return {
      fromFolder: true,
      documents: pinned
        .filter((doc) => !expired(doc.document_id))
        .map((doc) => ({
          id: doc.document_id,
          title: doc.document_title,
          view_url: doc.document_url ?? "",
        })),
      skippedExpired: pinned
        .filter((doc) => expired(doc.document_id))
        .map((doc) => doc.document_title ?? libraryById.get(doc.document_id)?.title),
    };
  }

  return {
    fromFolder: false,
    documents: documentsForContext(libraryDocuments ?? [], context).map((doc) => ({
      id: doc._id,
      title: doc.title,
      view_url: doc.document_url ?? "",
      expired: isExpiredDocument(doc, now),
    })),
    skippedExpired: [],
  };
};
