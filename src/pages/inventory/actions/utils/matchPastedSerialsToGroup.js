/**
 * Turns a pasted column of serial numbers into a selection inside a group
 * that is already known (the matches from step 1 of the update wizard),
 * rather than creating anything new. Unlike parsePastedInventoryRows — which
 * builds brand-new items to insert — this only ever selects units that
 * already exist in the matched group; anything else is reported as
 * unmatched instead of guessed at.
 */

const splitLines = (text) =>
  String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");

const firstCell = (line) => line.split(/\t|,|;/)[0].trim();

/**
 * @param {string} text - pasted clipboard content, one serial per line
 *   (extra columns are ignored — only the first cell is read).
 * @param {Array<object>} matches - the group's items, each carrying serial_number.
 * @returns {{matchedSerials: string[], unmatched: Array<{line: number, value: string}>}}
 *   matchedSerials is deduplicated and in the order they were pasted.
 */
export const matchPastedSerialsToGroup = (text, matches = []) => {
  const known = new Set(
    (Array.isArray(matches) ? matches : [])
      .map((item) => String(item?.serial_number ?? "").trim())
      .filter(Boolean),
  );

  const cells = splitLines(text).map(firstCell).filter(Boolean);
  if (cells.length === 0) return { matchedSerials: [], unmatched: [] };

  // A first line that is not itself a known serial reads as a header
  // ("Serial number", "SN", ...) rather than data — but only drop it when
  // a later line IS a known serial; otherwise nothing here is known yet
  // and dropping line one would just discard real data.
  const hasHeader =
    cells.length > 1 &&
    !known.has(cells[0]) &&
    cells.slice(1).some((cell) => known.has(cell));
  const body = hasHeader ? cells.slice(1) : cells;
  const lineOffset = hasHeader ? 2 : 1;

  const matchedSerials = [];
  const unmatched = [];
  const seen = new Set();

  body.forEach((candidate, index) => {
    if (known.has(candidate)) {
      if (!seen.has(candidate)) {
        matchedSerials.push(candidate);
        seen.add(candidate);
      }
    } else {
      unmatched.push({ line: index + lineOffset, value: candidate });
    }
  });

  return { matchedSerials, unmatched };
};
