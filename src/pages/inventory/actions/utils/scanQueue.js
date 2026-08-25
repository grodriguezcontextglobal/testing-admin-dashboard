/**
 * What happens when a barcode scanner fires one read at the units field.
 *
 * A scanner types the code and then presses Enter, so the whole interaction is
 * one decision made hundreds of times in a row: is this label new, already
 * scanned, or nothing at all. Keeping it here rather than inside the input
 * means the rule can be tested, and that it matches the paste parser — both
 * fold case when comparing, because the same physical label read twice must
 * not become two units.
 */

export const SCAN_STATUS = {
  ADDED: "added",
  DUPLICATE: "duplicate",
  EMPTY: "empty",
};

/** Only the edges are cleaned: internal spacing and case belong to the label. */
const clean = (value) => String(value ?? "").trim();

/**
 * @param {string} value - the raw read.
 * @param {string[]} alreadyScanned - serials collected so far.
 * @returns {{status: string, serial: string}} `serial` is the cleaned value,
 *   present on every status so the caller can name it in a message.
 */
export const acceptScan = (value, alreadyScanned) => {
  const serial = clean(value);
  if (!serial) return { status: SCAN_STATUS.EMPTY, serial: "" };

  const seen = Array.isArray(alreadyScanned) ? alreadyScanned : [];
  const fingerprint = serial.toLowerCase();
  const isDuplicate = seen.some(
    (existing) => clean(existing).toLowerCase() === fingerprint,
  );

  return {
    status: isDuplicate ? SCAN_STATUS.DUPLICATE : SCAN_STATUS.ADDED,
    serial,
  };
};
