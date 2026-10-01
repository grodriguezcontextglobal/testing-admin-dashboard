import {
  assignDocument,
  unassignedDocuments,
} from "../../newEventProcess/documents/utils/documentAssignment";
import { isExpiredDocument } from "../../../Profile/Documents/utils/documentLibrary";

/**
 * Adding documents to an event from its quick-glance page — the same rules as
 * the new-event wizard, through the same helpers.
 *
 * It compared `_id` on `legal_documents_list` entries, which carry `id`:
 * `undefined === undefined`, so the picker kept offering documents already on
 * the event, and adding to an event that had any document added nothing.
 */

/** The Select's options: not on the event yet; expired ones disabled (2b.8). */
export const eventDocumentOptions = (available = [], assigned = [], now = new Date()) =>
  unassignedDocuments(available, assigned).map((doc) => {
    const expired = isExpiredDocument(doc, now);
    return {
      value: doc._id,
      label: expired ? `${doc.title} — Expired` : doc.title,
      disabled: expired,
    };
  });

/** The event's list with the chosen documents added — no duplicates, none expired. */
export const addDocumentsToEvent = (assigned = [], documents = [], now = new Date()) =>
  documents.reduce((list, doc) => assignDocument(list, doc, now).list, assigned ?? []);
