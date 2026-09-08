/**
 * The serial number written into an RFID tag, and back out of it.
 *
 * The labels for this inventory are printed *and* encoded in one pass: the
 * printer puts the serial on the face in ink and writes the same serial into
 * the tag's EPC bank. That is what makes a bulk read useful without any
 * server-side lookup — the tag names the device, so a pass over a pallet comes
 * back as a list of serials, which is exactly what the event check-in already
 * reconciles (`checkInFromEvent`).
 *
 * Two things the encoding has to survive, and both are why it is ASCII rather
 * than a number:
 *
 *   - Serials here are text with a zero-padded counter (`RRRRR001`). As a
 *     number, "0001" and "1" are the same value, and the tag stops naming one
 *     device. ASCII keeps every character it was given.
 *   - Nothing in this app may put a serial through `Number()`. That coercion is
 *     the root of the RRRRRNaN family of bugs; see
 *     events/quickGlance/consumer/utils/serialRange.js. Encoding and decoding
 *     here are character work, with no arithmetic anywhere.
 *
 * A decoded serial is a **candidate**, not a verdict. A factory EPC whose bytes
 * happen to be printable decodes to something that looks like a serial, and
 * nothing at this level can tell the difference. The arbiter is `reconcile`: a
 * serial the event never held lands as "not in this event" rather than becoming
 * data.
 */

/** The common EPC memory bank. Tags with 128, 240 or 496 bits also exist. */
export const EPC_BANK_BITS = 96;

/** How many characters a bank of this size can hold: one byte each. */
export const serialCapacity = (bits = EPC_BANK_BITS) => Math.floor(bits / 8);

/**
 * Printable ASCII without the space, which is reserved for padding.
 *
 * Permissive on purpose: it covers the letters, digits and hyphens these
 * serials use without this file having to hold a policy about their format.
 */
const PRINTABLE = /^[\x21-\x7E]+$/;

/** The two bytes a label template pads a short serial with. */
const isPadding = (byte) => byte === 0x00 || byte === 0x20;

const isPrintable = (byte) => byte >= 0x21 && byte <= 0x7e;

/**
 * The hex to write into a tag's EPC bank for this serial.
 *
 * Returns null rather than truncating a serial too long for the bank: a
 * truncated tag reads as a *different* device, which is worse than a tag that
 * was never written.
 *
 * @param {string} serial
 * @param {{bits?: number}} [options]
 * @returns {string|null} uppercase hex, padded to the bank width
 */
export const encodeSerialToEpc = (serial, { bits = EPC_BANK_BITS } = {}) => {
  const value = String(serial ?? "");
  if (!value || !PRINTABLE.test(value)) return null;

  const capacity = serialCapacity(bits);
  if (value.length > capacity) return null;

  const hex = Array.from(value, (character) =>
    character.charCodeAt(0).toString(16).padStart(2, "0")
  ).join("");

  return `${hex}${"00".repeat(capacity - value.length)}`.toUpperCase();
};

/**
 * The serial a tag was encoded with, or null when this tag is not one of ours.
 *
 * Recognises the padding rather than being told it: a template may pad with
 * `0x00` or `0x20`, on the left or the right, and a serial that fills the bank
 * carries no padding at all. Padding is stripped from the edges only — a pad
 * byte *inside* the value means this is not the ASCII layout, and joining
 * across it would invent a serial.
 *
 * @param {string} hex - the EPC as the reader reports it, spacing allowed
 * @returns {string|null}
 */
export const decodeSerialFromEpc = (hex) => {
  const raw = String(hex ?? "").replace(/\s+/g, "");
  if (!raw || raw.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(raw)) return null;

  const bytes = [];
  for (let index = 0; index < raw.length; index += 2) {
    bytes.push(parseInt(raw.slice(index, index + 2), 16));
  }

  let start = 0;
  let end = bytes.length;
  while (start < end && isPadding(bytes[start])) start += 1;
  while (end > start && isPadding(bytes[end - 1])) end -= 1;

  const body = bytes.slice(start, end);
  /* An unwritten bank reads as all zeros. Decoding that to "" and letting it
     through would check in a device that does not exist. */
  if (body.length === 0) return null;
  if (!body.every(isPrintable)) return null;

  return body.map((byte) => String.fromCharCode(byte)).join("");
};
