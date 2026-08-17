/**
 * Reads a pasted table of units into items ready for a bulk insert.
 *
 * The shape is whatever Excel puts on the clipboard when you copy a range:
 * one row per unit, a header row of column names, cells separated by tabs.
 * Nothing has to be retyped and there is no syntax to learn — the alternative
 * we considered, `serial number: A1, IMEI: X` per line, asks the user to
 * transcribe data they already have in a table.
 *
 *   Serial Number   IMEI     Device ID
 *   sdffaf1         kdhfhk   d654f64
 *   sdffaf2         oirl     65u3rtet6
 *
 * One column becomes the unit's serial_number and the rest become its extra
 * identifiers. Items do not have to carry the same identifiers: an empty cell
 * simply produces no identifier for that unit.
 *
 * Everything ambiguous is reported rather than guessed. A row that cannot
 * become an item lands in `skipped` with its source line number and a reason,
 * so the preview can show what will not be created and why — silently dropping
 * or silently guessing a serial number puts wrong data in inventory, which is
 * far more expensive than making someone fix their paste.
 */

/**
 * Most lines a single paste may carry, counting the header row — so the ceiling
 * is 1999 units per paste.
 *
 * Past the limit the paste is rejected outright rather than truncated. Keeping
 * the first 2000 rows would hand back a group that looks complete and is not,
 * and the only way to find out which units were dropped would be to diff the
 * created group against the original spreadsheet. Splitting the paste is a
 * minute of work; reconciling a silently partial import is not.
 */
export const MAX_PASTED_LINES = 2000;

/** Ordered by how much they imply a real table: a tab is never incidental. */
const DELIMITERS = ["\t", ";", ","];

const normalizeName = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/**
 * Header spellings that mean "this is the serial number". Accented forms
 * normalize away, so "Número de Serie" and "numero de serie" both land here.
 */
const SERIAL_COLUMN_NAMES = new Set([
  "serialnumber",
  "serialno",
  "serial",
  "sn",
  "numerodeserie",
  "nmerodeserie",
  "nrodeserie",
  "numeroserie",
  "serie",
]);

const splitLines = (text) =>
  String(text ?? "")
    .split(/\r?\n/)
    .map((line, index) => ({ raw: line, line: index + 1 }))
    .filter(({ raw }) => raw.trim() !== "");

/**
 * The delimiter is chosen from the first row alone. Picking per-row would let a
 * value containing a comma change how the row below it is read.
 */
const detectDelimiter = (headerLine) =>
  DELIMITERS.find((delimiter) => headerLine.includes(delimiter)) ?? "\t";

const splitRow = (raw, delimiter) =>
  raw.split(delimiter).map((cell) => cell.trim());

/**
 * @param {string} text - the pasted clipboard content.
 * @param {{hasHeaderRow?: boolean, existingSerials?: string[]}} options
 *   hasHeaderRow defaults to true; when false the columns are named
 *   "Column 1..N" and no row is consumed, so a paste without headers loses
 *   nothing.
 * @returns {{delimiter: string, columns: Array<{label: string, isPrimary: boolean}>,
 *   primaryColumn: {label: string, index: number}|null,
 *   items: Array<{serial: string, identifiers: Array<{keyObject: string, valueObject: string}>,
 *     line: number, warnings: string[]}>,
 *   skipped: Array<{line: number, raw: string, reason: string}>,
 *   error: {code: string, lines: number, limit: number}|null}}
 *   `error` is set only when the paste is refused as a whole; `skipped` covers
 *   rows refused individually. Both are always present so a caller can read one
 *   field without guessing at the shape.
 */
const parsePastedInventoryRows = (
  text,
  { hasHeaderRow = true, existingSerials = [] } = {},
) => {
  const lines = splitLines(text);
  const empty = {
    delimiter: "\t",
    columns: [],
    primaryColumn: null,
    items: [],
    skipped: [],
    error: null,
  };
  if (lines.length === 0) return empty;

  // Blank lines are ignored everywhere else in this parser, so they do not
  // count here either — a paste with double line breaks is not a bigger paste.
  if (lines.length > MAX_PASTED_LINES) {
    return {
      ...empty,
      error: {
        code: "too_many_lines",
        lines: lines.length,
        limit: MAX_PASTED_LINES,
      },
    };
  }

  const delimiter = detectDelimiter(lines[0].raw);

  const headerCells = splitRow(lines[0].raw, delimiter);
  const bodyLines = hasHeaderRow ? lines.slice(1) : lines;

  const width = hasHeaderRow
    ? headerCells.length
    : Math.max(...lines.map(({ raw }) => splitRow(raw, delimiter).length));

  const labels = hasHeaderRow
    ? headerCells.map((cell, index) => cell || `Column ${index + 1}`)
    : Array.from({ length: width }, (_, index) => `Column ${index + 1}`);

  // A column actually named "serial number" wins wherever it sits, so a paste
  // whose columns are in a different order still works. Otherwise the first
  // column is the serial, which is the convention the UI states.
  const namedPrimary = labels.findIndex((label) =>
    SERIAL_COLUMN_NAMES.has(normalizeName(label)),
  );
  const primaryIndex = namedPrimary >= 0 ? namedPrimary : 0;

  const columns = labels.map((label, index) => ({
    label,
    isPrimary: index === primaryIndex,
  }));

  const items = [];
  const skipped = [];
  // Case-only differences are the same physical unit far more often than they
  // are two units, so dedupe folds case while the stored value keeps the
  // spelling that was pasted.
  const seen = new Set(
    existingSerials.map((serial) => String(serial).trim().toLowerCase()),
  );
  const fromThisPaste = new Set();

  for (const { raw, line } of bodyLines) {
    const cells = splitRow(raw, delimiter);
    const serial = cells[primaryIndex] ?? "";

    if (!serial) {
      skipped.push({
        line,
        raw,
        reason: `no serial number in the ${labels[primaryIndex]} column`,
      });
      continue;
    }

    const fingerprint = serial.toLowerCase();
    if (seen.has(fingerprint)) {
      skipped.push({
        line,
        raw,
        reason: fromThisPaste.has(fingerprint)
          ? `duplicate of ${serial}`
          : `${serial} is already in the list`,
      });
      continue;
    }
    seen.add(fingerprint);
    fromThisPaste.add(fingerprint);

    const warnings = [];
    const identifiers = [];
    cells.forEach((value, index) => {
      if (index === primaryIndex || !value) return;
      identifiers.push({
        keyObject: labels[index] ?? `Column ${index + 1}`,
        valueObject: value,
      });
    });

    // More cells than named columns usually means the delimiter appears inside
    // a value. The data is kept under a positional name rather than dropped,
    // and flagged so the preview can say so.
    const overflow = cells.length - labels.length;
    if (overflow > 0) {
      warnings.push(
        `${overflow} value${overflow === 1 ? "" : "s"} beyond the last named column`,
      );
    }

    items.push({ serial, identifiers, line, warnings });
  }

  return {
    delimiter,
    columns,
    primaryColumn: { label: labels[primaryIndex], index: primaryIndex },
    items,
    skipped,
    error: null,
  };
};

export default parsePastedInventoryRows;
