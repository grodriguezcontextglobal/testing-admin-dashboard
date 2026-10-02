import { missingFieldMessages } from "./memberContactRules";

/**
 * Turning the importer's flat message lists into something the preview can show.
 *
 * `validateAndNormalizeRows` reports problems as strings prefixed with the row
 * they belong to ("Row 4: missing required field(s): email"), and the preview
 * table rendered the rows on one side and the messages on the other. With a
 * fifty-row sheet that means counting rows by hand to find the one the message
 * is about. This pairs them back up.
 *
 * Nothing here validates anything — it only reads what the importer already
 * decided, so the two cannot disagree.
 */

const ROW_PREFIX = /^Row\s+(\d+):\s*/;

/**
 * Messages split into the ones that name a row and the ones that do not.
 *
 * A message with no row prefix — "Failed to read file: …" — still has to be
 * seen, so it is kept rather than dropped on the floor.
 */
export function parseRowIssues(messages) {
  const byRow = new Map();
  const general = [];

  (Array.isArray(messages) ? messages : []).forEach((message) => {
    const text = String(message ?? "");
    const match = text.match(ROW_PREFIX);
    if (!match) {
      if (text) general.push(text);
      return;
    }
    const rowNumber = Number(match[1]);
    const rest = text.slice(match[0].length);
    byRow.set(rowNumber, [...(byRow.get(rowNumber) ?? []), rest]);
  });

  return { byRow, general };
}

/**
 * Each normalized row carrying its own problems and a status.
 *
 * The importer pushes one output row per input row, valid or not, so the row
 * number a message names is simply the index plus one.
 */
export function annotateImportRows(rows, errors, warnings) {
  const list = Array.isArray(rows) ? rows : [];
  const errorsByRow = parseRowIssues(errors).byRow;
  const warningsByRow = parseRowIssues(warnings).byRow;

  return list.map((row, index) => {
    const rowNumber = index + 1;
    const rowErrors = errorsByRow.get(rowNumber) ?? [];
    const rowWarnings = warningsByRow.get(rowNumber) ?? [];

    return {
      ...row,
      key: `row-${rowNumber}`,
      _rowNumber: rowNumber,
      _errors: rowErrors,
      _warnings: rowWarnings,
      // Blocked wins: a row that is both warned and errored does not import.
      _status: rowErrors.length > 0 ? "blocked" : rowWarnings.length > 0 ? "warning" : "ready",
    };
  });
}

/** How many rows will import, how many will not, and how many need a look. */
export function importCounts(annotated) {
  const list = Array.isArray(annotated) ? annotated : [];
  return {
    total: list.length,
    blocked: list.filter((row) => row._status === "blocked").length,
    warned: list.filter((row) => row._status === "warning").length,
    ready: list.filter((row) => row._status === "ready").length,
  };
}

/**
 * The messages that belong to the file rather than to a row.
 *
 * Listing every message under the table as well as on its row would say the
 * same thing twice, so only these are shown separately.
 */
export function generalIssues(errors, warnings) {
  return [...parseRowIssues(errors).general, ...parseRowIssues(warnings).general];
}

/**
 * What POST /db_member/bulk-members actually did (feat/member-contact-minors).
 * It skips rows that break the contact rule and inserts the rest, so a
 * successful response is not "everything imported":
 *
 *   { ok, requested, inserted, skipped, contact_skipped: [{ row, missing, msg }] }
 *
 * `row` is the 0-based index in the list sent, i.e. the preview's "#" minus
 * one. `skipped` also counts rows without a name, which carry no reason. The
 * old server sends no contact_skipped, and maybe no counts: that reads as
 * every row imported, which is what it meant then.
 *
 * @param {object} data response body (201, 202 or 400)
 * @param {object[]} sent the rows sent, in order
 */
export function summarizeBulkMembersResult(data, sent, { representativeLabel = "Guardian" } = {}) {
  const list = Array.isArray(sent) ? sent : [];
  const contactSkipped = Array.isArray(data?.contact_skipped) ? data.contact_skipped : [];
  const skipped = Number.isFinite(data?.skipped) ? data.skipped : contactSkipped.length;

  const skippedRows = contactSkipped.map((entry) => {
    const row = list[entry?.row] ?? {};
    const reasons = missingFieldMessages(entry?.missing, representativeLabel);
    return {
      rowNumber: Number(entry?.row) + 1,
      name: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim(),
      reason: reasons.length ? reasons.join(" ") : String(entry?.msg ?? "Skipped by the server."),
    };
  });

  return {
    inserted: Number.isFinite(data?.inserted) ? data.inserted : Math.max(0, list.length - skipped),
    skippedRows,
    skippedWithoutReason: Math.max(0, skipped - contactSkipped.length),
  };
}
