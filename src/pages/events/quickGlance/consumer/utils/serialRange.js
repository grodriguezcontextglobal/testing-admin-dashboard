/**
 * Serial numbers, treated as text with a trailing counter rather than as
 * numbers.
 *
 * This is the fix for the `RRRRRNaN` the transaction screens displayed. The old
 * code, copy-pasted into five components, did:
 *
 *     findingRange.add(Number(devicesInPool[i].device));   // "RRRRR001" → NaN
 *     const max = Math.max(...result);                     // NaN
 *     String(max).padStart(reference.length, reference[0]); // "RRRRRNaN"
 *
 * — it coerced the serial to a number, lost the prefix, then tried to rebuild
 * the prefix by repeating the *first character* of an unrelated reference
 * serial. Any serial that was not purely numeric came back as garbage, and the
 * same `Number()` coercion turned the multi-device quantity
 * (`endingNumber - startingNumber + 1`) into `NaN`.
 *
 * Nothing here reconstructs a serial from a number: the strings the API gave us
 * are the strings we display. Arithmetic happens only on the trailing digit run,
 * and only when both ends actually have one.
 */

/** A range wider than this is a typo, not a request. */
const MAX_RANGE_SIZE = 5000;

const SERIAL_PATTERN = /^(.*?)(\d+)$/;

/**
 * Split a serial into its prefix and its trailing counter.
 *
 * `RRRRR001` → prefix `RRRRR`, digits `001`, number 1, width 3.
 * Only the *trailing* digit run counts, so `A1B2C34` is `A1B2C` + `34`.
 */
export function parseSerial(serial) {
  const raw = String(serial ?? "").trim();
  const match = raw.match(SERIAL_PATTERN);

  if (!match) {
    return {
      raw,
      prefix: raw,
      digits: "",
      number: null,
      width: 0,
      isNumeric: false,
    };
  }

  const [, prefix, digits] = match;
  return {
    raw,
    prefix,
    digits,
    number: Number(digits),
    width: digits.length,
    isNumeric: true,
  };
}

/**
 * Human ordering: same prefix compares by counter, so RRRRR9 sorts before
 * RRRRR10 (plain string comparison gets that backwards).
 */
export function compareSerials(a, b) {
  const left = parseSerial(a);
  const right = parseSerial(b);

  if (left.prefix === right.prefix && left.isNumeric && right.isNumeric) {
    return left.number - right.number;
  }
  if (left.prefix !== right.prefix) {
    return left.prefix < right.prefix ? -1 : left.prefix > right.prefix ? 1 : 0;
  }
  // Same prefix, but at least one has no counter — the bare prefix sorts first.
  return left.isNumeric ? 1 : right.isNumeric ? -1 : 0;
}

export function sortSerials(serials) {
  const list = Array.isArray(serials) ? serials : [];
  return [...list].sort(compareSerials);
}

/**
 * What to show as "available serials" for a device type: the real lowest and
 * highest strings, plus how many there are.
 *
 * Returns nulls when nothing is available. The old version returned
 * `{ min: 0, max: 0 }`, which rendered as "0 - 0" and read like a real range.
 */
export function serialRangeLabel(serials) {
  const list = (Array.isArray(serials) ? serials : []).filter(
    (serial) => serial !== null && serial !== undefined && String(serial).trim() !== ""
  );

  if (list.length === 0) return { min: null, max: null, count: 0 };

  const sorted = sortSerials(list);
  return {
    min: parseSerial(sorted[0]).raw,
    max: parseSerial(sorted.at(-1)).raw,
    count: list.length,
  };
}

const buildSerial = (prefix, number, width) =>
  `${prefix}${String(number).padStart(width, "0")}`;

/** The serial one step up, keeping the zero-padding width. */
export function nextSerial(serial) {
  const parsed = parseSerial(serial);
  if (!parsed.isNumeric) return null;
  return buildSerial(parsed.prefix, parsed.number + 1, parsed.width);
}

/** How many serials an inclusive range covers, or null if it is not a range. */
export function countSerialsBetween(start, end) {
  const from = parseSerial(start);
  const to = parseSerial(end);

  if (!from.isNumeric || !to.isNumeric) return null;
  if (from.prefix !== to.prefix) return null;
  if (to.number < from.number) return null;

  return to.number - from.number + 1;
}

/** Every serial in an inclusive range, or null if it cannot be expanded. */
export function expandSerialRange(start, end) {
  const size = countSerialsBetween(start, end);
  if (size === null || size > MAX_RANGE_SIZE) return null;

  const from = parseSerial(start);
  return Array.from({ length: size }, (_, index) =>
    buildSerial(from.prefix, from.number + index, from.width)
  );
}
