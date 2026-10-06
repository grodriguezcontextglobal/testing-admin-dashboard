import { buildUsesForOptions, SCHOOL_CONSENT } from "../../../../components/documents/utils/documentUploadForm";
import { isDocumentExpired } from "./documentExpirationUtils";

/**
 * Editing a document: its status, its expiration date, and the body it saves.
 *
 * Meeting 2026-09-29 `37:36`–`38:18`: an expired document stays in the library
 * so it can be changed "or change it back to active". Edit document had
 * neither the expiration date nor the status, so the one field that decides
 * whether a document can still be handed out was the one it could not change.
 *
 * Going back to active is either a new date ahead of today or no date at all.
 */

const text = (value) => String(value ?? "").trim();

/**
 * `YYYY-MM-DD`, which is all a date input accepts; "" when there is no date.
 *
 * A stored timestamp is read in the reader's own timezone, not sliced off the
 * front of the ISO string: end of 31 December in New York is 1 January in UTC,
 * and slicing would show the day after — then save it, and the date would
 * creep forward one day per edit. A value that is already a bare date has no
 * timezone to convert and is passed through.
 */
export const toDateInputValue = (value) => {
  if (!value) return "";
  const asText = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(asText)) return asText;
  const date = new Date(asText);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/**
 * The chosen day's last moment, in the reader's own timezone.
 *
 * `new Date("2026-12-31")` is UTC midnight, which west of UTC is the evening
 * of the 30th: a document set to expire on the 31st would stop working a day
 * early. Expiring at the end of the day also matches what "expires on the
 * 31st" means to whoever typed it.
 */
export const expirationToISO = (dateInputValue) => {
  const value = text(dateInputValue);
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
};

/**
 * Where the document stands today.
 *
 * @returns {{key: "active"|"expired", label: string, tone: string, expiresOn: string|null}}
 */
export const describeDocumentStatus = (document, now = new Date()) => {
  const expiresOn = toDateInputValue(document?.expiration_date) || null;
  const expired = isDocumentExpired(document?.expiration_date, now);
  return expired
    ? { key: "expired", label: "Expired", tone: "warning", expiresOn }
    : { key: "active", label: "Active", tone: "success", expiresOn };
};

/**
 * The uses the edit form offers: the company's own, plus the document's
 * current value when it is one the upload form no longer offers (`on_login`,
 * `scheduled`). Keeping it means saving an unrelated field does not silently
 * move the document to another path.
 */
export const editableUsesForOptions = (industry, currentUse) => {
  const options = buildUsesForOptions(industry);
  const current = text(currentUse);
  if (current && !options.some((option) => option.id === current)) {
    return [...options, { id: current, label: current, note: "This document's current value" }];
  }
  return options;
};

/**
 * The body for the save. `expiration_date` is `null` — not omitted — when the
 * field is cleared, because that is what drops the date instead of leaving it
 * as it was.
 */
export const buildDocumentEditPayload = ({ document, values }) => {
  const payload = {
    title: text(values?.title),
    document_type: values?.document_type ?? document?.document_type ?? "document",
    trigger_action: values?.trigger_action,
    /* Only a document tagged for the school consent flow is served through the
       unauthenticated guardian endpoint — the same rule the upload applies. */
    public_document: values?.trigger_action === SCHOOL_CONSENT,
    expiration_date: expirationToISO(values?.expiration_date),
  };
  if (text(values?.description)) payload.description = text(values.description);
  return payload;
};
