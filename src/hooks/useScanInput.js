import { useCallback, useRef } from "react";
import { containsScanValue, normalizeScanValue } from "../utils/scan/scanInput";

/** Why an add() was refused. */
export const SCAN_REJECTED_EMPTY = "empty";
export const SCAN_REJECTED_DUPLICATE = "duplicate";

/**
 * Accumulates scanned/typed identifiers into a list, for the "sweep a batch of
 * items into this modal" flows.
 *
 * Handles the three things every scan-in screen was previously getting right or
 * wrong independently:
 *
 *  - normalization, so a stray terminator or affix from the reader does not
 *    become an unmatchable value (see ../utils/scan/scanInput.js);
 *  - deduplication, which stops mattering when a person types and starts
 *    mattering a lot with a reader that re-reads a tag every time it sees it.
 *    A duplicate is reported, never appended, so the list is safe to key by
 *    value in React;
 *  - keeping focus in the field, so a reader can fire consecutive reads without
 *    the operator clicking back in.
 *
 * The list is owned by the caller (`values`/`setValues`) because these lists are
 * usually lifted into a parent form's state.
 *
 * @param {object} params
 * @param {string[]} params.values - Current list.
 * @param {(next: string[]) => void} params.setValues - Replaces the list.
 * @param {object} [params.options] - Normalization overrides; pass a stable
 *   object (module-level or memoized), since the callbacks memoize on it.
 * @returns {{
 *   inputRef: import("react").RefObject<HTMLInputElement>,
 *   add: (raw: unknown) => { ok: boolean, value: string, kind?: string, reason?: string },
 *   remove: (value: string) => void,
 *   removeAt: (index: number) => void,
 *   clear: () => void,
 *   focusInput: () => void,
 * }}
 */
export const useScanInput = ({ values, setValues, options } = {}) => {
  const inputRef = useRef(null);

  const focusInput = useCallback(() => {
    // The ref may point at a wrapper (MUI) rather than the input itself.
    const node = inputRef.current;
    if (!node) return;
    if (typeof node.focus === "function") return node.focus();
    return node.querySelector?.("input")?.focus?.();
  }, []);

  const add = useCallback(
    (raw) => {
      const { value, kind } = normalizeScanValue(raw, options);
      if (!value) {
        focusInput();
        return { ok: false, value: "", reason: SCAN_REJECTED_EMPTY };
      }
      if (containsScanValue(values, value, options)) {
        focusInput();
        return { ok: false, value, kind, reason: SCAN_REJECTED_DUPLICATE };
      }
      setValues([...(values ?? []), value]);
      focusInput();
      return { ok: true, value, kind };
    },
    [values, setValues, options, focusInput],
  );

  const remove = useCallback(
    (value) => setValues((values ?? []).filter((entry) => entry !== value)),
    [values, setValues],
  );

  const removeAt = useCallback(
    (index) => setValues((values ?? []).filter((_, i) => i !== index)),
    [values, setValues],
  );

  const clear = useCallback(() => setValues([]), [setValues]);

  return { inputRef, add, remove, removeAt, clear, focusInput };
};

export default useScanInput;
