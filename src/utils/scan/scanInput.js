import { SCAN_INPUT_SETTINGS } from "../../config/scanning";

/**
 * Normalization shared by every scanner-facing input.
 *
 * Before this existed each scan-in screen re-implemented its own handling, and
 * they disagreed: some trimmed, some did not, some deduplicated, some compared
 * case-sensitively. That was survivable while every scan was a short printed
 * serial typed by a person. It is not survivable with a hardware reader, whose
 * output we do not control and which can be programmed to wrap reads in
 * affixes and terminate them with CR/LF/Tab.
 *
 * See ../../config/scanning.js for the reader-dependent knobs.
 */

/**
 * Control characters, which is where a reader's terminator ends up.
 *
 * A scanner in keyboard mode "types" its terminator. Enter submits the form, so
 * we never see it — but a reader configured for Tab or CR-LF, or one whose read
 * lands in a field that is not submit-on-Enter, glues the terminator onto the
 * value. Stripping these first means a mis-programmed terminator degrades to a
 * value we can still match instead of a mystery mismatch.
 */
// Matching control characters is precisely the intent here, so the rule that
// flags them inside a regex does not apply.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/g;

/** A read whose kind we cannot determine (no configured prefix matched). */
export const SCAN_KIND_UNKNOWN = "unknown";

/**
 * Cleans one raw scanned/typed value and reports what kind of read it was.
 *
 * @param {unknown} raw - Whatever the input produced; non-strings are coerced.
 * @param {object} [overrides] - Partial SCAN_INPUT_SETTINGS. Pass a stable
 *   (module-level or memoized) object if you override, since callers memoize on
 *   its identity.
 * @returns {{ value: string, kind: string }} `value` is "" when the read was
 *   empty or was nothing but affixes/whitespace.
 */
export const normalizeScanValue = (raw, overrides) => {
  const settings = overrides
    ? { ...SCAN_INPUT_SETTINGS, ...overrides }
    : SCAN_INPUT_SETTINGS;

  let value = raw === null || raw === undefined ? "" : String(raw);
  value = value.replace(CONTROL_CHARACTERS, "").trim();

  const prefix = settings.prefixes?.find(
    (candidate) => candidate.value && value.startsWith(candidate.value),
  );
  if (prefix) value = value.slice(prefix.value.length);

  const suffix = settings.suffixes?.find(
    (candidate) => candidate.value && value.endsWith(candidate.value),
  );
  if (suffix) value = value.slice(0, value.length - suffix.value.length);

  value = value.trim();

  if (settings.stripInnerWhitespace) value = value.replace(/\s+/g, "");
  if (settings.caseMode === "upper") value = value.toUpperCase();
  else if (settings.caseMode === "lower") value = value.toLowerCase();

  return { value, kind: prefix?.kind ?? suffix?.kind ?? SCAN_KIND_UNKNOWN };
};

/** Convenience for callers that only want the cleaned string. */
export const cleanScanValue = (raw, overrides) =>
  normalizeScanValue(raw, overrides).value;

/**
 * Whether two identifiers are the same read, compared after normalization.
 *
 * Empty never matches anything — including another empty — so a blank scan
 * cannot silently resolve to an inventory row with a blank serial.
 */
export const scanValuesMatch = (a, b, overrides) => {
  const left = normalizeScanValue(a, overrides).value;
  if (!left) return false;
  return left === normalizeScanValue(b, overrides).value;
};

/**
 * Whether `list` already holds `value`.
 *
 * @param {Array<unknown>} list - Raw or already-normalized entries.
 * @param {unknown} value
 * @param {object} [options]
 * @param {(entry: unknown) => unknown} [options.getValue] - Read the
 *   identifier off a non-string entry (e.g. an inventory row).
 */
export const containsScanValue = (list, value, options) => {
  const { getValue, ...overrides } = options ?? {};
  const target = normalizeScanValue(value, overrides).value;
  if (!target) return false;
  return (list ?? []).some(
    (entry) =>
      normalizeScanValue(getValue ? getValue(entry) : entry, overrides).value ===
      target,
  );
};

/**
 * Finds the entry in `list` that `value` identifies, or undefined.
 * Same options as containsScanValue.
 */
export const findByScanValue = (list, value, options) => {
  const { getValue, ...overrides } = options ?? {};
  const target = normalizeScanValue(value, overrides).value;
  if (!target) return undefined;
  return (list ?? []).find(
    (entry) =>
      normalizeScanValue(getValue ? getValue(entry) : entry, overrides).value ===
      target,
  );
};
