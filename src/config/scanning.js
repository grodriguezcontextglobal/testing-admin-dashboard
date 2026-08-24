/**
 * Reader-dependent settings for every scanner-facing input in the app.
 *
 * All of these are properties of the *physical reader*, not of our data, so
 * they live in one place: when the reader is finally programmed we edit this
 * file once instead of hunting through the scan-in screens.
 *
 * Context: we are adding RFID (EPC Gen2 / GIAI-96) alongside the existing
 * optical scanners. A GIAI-96 EPC is 24 hex characters, where today's printed
 * serials are short strings like "300", so the same input has to accept both.
 * The `prefixes`/`suffixes`/`caseMode` values below stay empty/neutral until
 * the vendor confirms what the OR2505 can emit and we program it — leaving
 * them neutral is exactly equivalent to the previous hand-rolled behaviour
 * plus trimming, so turning this on changes nothing until it is configured.
 */

/**
 * How to fold case before comparing a scanned value against stored ones.
 *
 * "preserve" is the safe default: two inventory rows that differ only by case
 * are legal today, so folding case here could silently make a scan ambiguous.
 * Switch to "upper" (or "lower") only once we know the reader's hex output
 * case and have confirmed it disagrees with what we store.
 */
export const SCAN_CASE_MODE = "preserve";

/**
 * Affixes the reader is programmed to wrap a read in, used both to strip them
 * off and to tell *what kind* of read arrived. Give RFID and optical reads
 * different prefixes on the device and each read classifies itself, which is
 * how one input can route both without a mode toggle in the UI.
 *
 * Shape: { kind: "rfid" | "optical", value: "<literal characters>" }
 * Order matters only if one affix is a prefix of another; longest first.
 */
export const SCAN_PREFIXES = [];
export const SCAN_SUFFIXES = [];

/**
 * Whether to remove whitespace *inside* a scanned value.
 *
 * Some readers emit a 96-bit EPC as space-separated hex byte pairs
 * ("34 25 E1 6C ..."). If ours does, flip this on and the grouped form will
 * match the stored unspaced one. Off by default because a printed serial is
 * allowed to contain a space, and we must not silently rewrite those.
 */
export const SCAN_STRIP_INNER_WHITESPACE = false;

/** Defaults consumed by normalizeScanValue(); override per call site if ever needed. */
export const SCAN_INPUT_SETTINGS = {
  caseMode: SCAN_CASE_MODE,
  prefixes: SCAN_PREFIXES,
  suffixes: SCAN_SUFFIXES,
  stripInnerWhitespace: SCAN_STRIP_INNER_WHITESPACE,
};
