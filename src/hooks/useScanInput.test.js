import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import {
  useScanInput,
  SCAN_REJECTED_DUPLICATE,
  SCAN_REJECTED_EMPTY,
} from "./useScanInput";

/** Drives the hook with real caller-owned state, the way the screens use it. */
function renderScanInput(initial = [], options) {
  return renderHook(() => {
    const [values, setValues] = useState(initial);
    return { values, ...useScanInput({ values, setValues, options }) };
  });
}

describe("useScanInput", () => {
  it("appends a normalized value", () => {
    const { result } = renderScanInput();
    act(() => {
      result.current.add("  300  ");
    });
    expect(result.current.values).toEqual(["300"]);
  });

  it("strips a terminator the reader glued onto the read", () => {
    const { result } = renderScanInput();
    act(() => {
      result.current.add("300\r\n");
    });
    expect(result.current.values).toEqual(["300"]);
  });

  it("refuses an empty or whitespace-only read", () => {
    const { result } = renderScanInput(["300"]);
    let outcome;
    act(() => {
      outcome = result.current.add("   ");
    });
    expect(outcome).toMatchObject({ ok: false, reason: SCAN_REJECTED_EMPTY });
    expect(result.current.values).toEqual(["300"]);
  });

  it("refuses a duplicate instead of appending it", () => {
    const { result } = renderScanInput(["300"]);
    let outcome;
    act(() => {
      outcome = result.current.add("300");
    });
    expect(outcome).toMatchObject({
      ok: false,
      reason: SCAN_REJECTED_DUPLICATE,
      value: "300",
    });
    expect(result.current.values).toEqual(["300"]);
  });

  it("treats a re-read of a tag still in range as a duplicate, not a new item", () => {
    // A reader left pointing at a tag emits it repeatedly; the list must not grow.
    const { result } = renderScanInput();
    act(() => {
      result.current.add("3425E16CB400000000003039");
    });
    act(() => {
      result.current.add("3425E16CB400000000003039\r\n");
    });
    act(() => {
      result.current.add(" 3425E16CB400000000003039 ");
    });
    expect(result.current.values).toEqual(["3425E16CB400000000003039"]);
  });

  it("keeps the list unique so entries are safe to use as React keys", () => {
    const { result } = renderScanInput();
    act(() => {
      result.current.add("300");
    });
    act(() => {
      result.current.add("301");
    });
    act(() => {
      result.current.add("300");
    });
    expect(result.current.values).toEqual(["300", "301"]);
    expect(new Set(result.current.values).size).toBe(result.current.values.length);
  });

  it("accepts a long EPC and a short serial in the same list", () => {
    const { result } = renderScanInput();
    act(() => {
      result.current.add("300");
    });
    act(() => {
      result.current.add("3425E16CB400000000003039");
    });
    expect(result.current.values).toEqual([
      "300",
      "3425E16CB400000000003039",
    ]);
  });

  it("reports the read kind from a configured prefix", () => {
    const options = { prefixes: [{ kind: "rfid", value: "%R" }] };
    const { result } = renderScanInput([], options);
    let outcome;
    act(() => {
      outcome = result.current.add("%R3425E16CB400000000003039");
    });
    expect(outcome).toMatchObject({
      ok: true,
      kind: "rfid",
      value: "3425E16CB400000000003039",
    });
    expect(result.current.values).toEqual(["3425E16CB400000000003039"]);
  });

  it("removes by value and by index, and clears", () => {
    const { result } = renderScanInput(["300", "301", "302"]);
    act(() => {
      result.current.remove("301");
    });
    expect(result.current.values).toEqual(["300", "302"]);
    act(() => {
      result.current.removeAt(0);
    });
    expect(result.current.values).toEqual(["302"]);
    act(() => {
      result.current.clear();
    });
    expect(result.current.values).toEqual([]);
  });

  it("returns focus to the input after every add, so reads can chain", () => {
    const { result } = renderScanInput();
    const focus = vi.fn();
    result.current.inputRef.current = { focus };
    act(() => {
      result.current.add("300");
    });
    act(() => {
      result.current.add("300"); // duplicate: still needs focus back
    });
    act(() => {
      result.current.add(""); // empty: still needs focus back
    });
    expect(focus).toHaveBeenCalledTimes(3);
  });

  it("focuses the inner input when the ref points at a wrapper", () => {
    const { result } = renderScanInput();
    const focus = vi.fn();
    result.current.inputRef.current = {
      querySelector: () => ({ focus }),
    };
    act(() => {
      result.current.add("300");
    });
    expect(focus).toHaveBeenCalledTimes(1);
  });
});
