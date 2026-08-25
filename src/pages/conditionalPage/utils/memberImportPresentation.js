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
