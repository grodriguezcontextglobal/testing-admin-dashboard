import { describe, expect, it } from "vitest";
import {
  centsToAmount,
  clampCaptureAmount,
  describeDepositState,
  formatCents,
} from "./depositAmount";

describe("centsToAmount", () => {
  it("converts cents to whole dollars", () => {
    expect(centsToAmount(5000)).toBe(50);
  });

  it("keeps the cents part when there is one", () => {
    expect(centsToAmount(5050)).toBe(50.5);
  });

  it("handles an amount under a dollar", () => {
    // `String(50).slice(0, -2)` gave "0" — it dropped the whole amount.
    expect(centsToAmount(50)).toBe(0.5);
  });

  it("handles a single-digit cent amount", () => {
    // `String(5).slice(0, -2)` gave "" — an empty string in the amount field.
    expect(centsToAmount(5)).toBe(0.05);
  });

  it("returns zero for nothing known", () => {
    // `String(undefined).slice(0, -2)` gave "undefin", which was rendered into
    // the amount input as if it were money.
    expect(centsToAmount(undefined)).toBe(0);
    expect(centsToAmount(null)).toBe(0);
    expect(centsToAmount("not-a-number")).toBe(0);
  });

  it("accepts a numeric string from the API", () => {
    expect(centsToAmount("12345")).toBe(123.45);
  });
});

describe("formatCents", () => {
  it("formats a whole-dollar deposit", () => {
    expect(formatCents(20000)).toBe("$200");
  });

  it("shows cents only when they exist", () => {
    expect(formatCents(20050)).toBe("$200.50");
  });

  it("groups thousands", () => {
    expect(formatCents(150000)).toBe("$1,500");
  });

  it("renders an unknown amount as a dash rather than as $0", () => {
    expect(formatCents(undefined)).toBe("—");
    expect(formatCents(null)).toBe("—");
  });

  it("renders a genuine zero as $0", () => {
    expect(formatCents(0)).toBe("$0");
  });
});

describe("describeDepositState", () => {
  it("allows capture and release on a held deposit", () => {
    const state = describeDepositState("requires_capture");
    expect(state.canCapture).toBe(true);
    expect(state.canRelease).toBe(true);
    expect(state.tone).toBe("warning");
    expect(state.label).toBe("Deposit held");
  });

  it("blocks both once the deposit was captured", () => {
    const state = describeDepositState("succeeded");
    expect(state.canCapture).toBe(false);
    expect(state.canRelease).toBe(false);
    expect(state.label).toBe("Captured");
    expect(state.reason).toMatch(/captured/i);
  });

  it("blocks both once the deposit was released", () => {
    const state = describeDepositState("canceled");
    expect(state.canCapture).toBe(false);
    expect(state.canRelease).toBe(false);
    expect(state.label).toBe("Released");
    expect(state.reason).toMatch(/released/i);
  });

  it("blocks both while the card is still being confirmed", () => {
    const state = describeDepositState("requires_payment_method");
    expect(state.canCapture).toBe(false);
    expect(state.canRelease).toBe(false);
    expect(state.tone).toBe("neutral");
  });

  it("blocks both and says so for an unknown status", () => {
    const state = describeDepositState("something_new");
    expect(state.canCapture).toBe(false);
    expect(state.canRelease).toBe(false);
    expect(state.reason).toContain("something_new");
  });

  it("blocks both when there is no status at all", () => {
    const state = describeDepositState(undefined);
    expect(state.canCapture).toBe(false);
    expect(state.canRelease).toBe(false);
    expect(typeof state.reason).toBe("string");
  });

  it("always carries a label and a reason", () => {
    ["requires_capture", "succeeded", "canceled", "processing", undefined].forEach(
      (status) => {
        const state = describeDepositState(status);
        expect(state.label).toBeTruthy();
        expect(state.reason).toBeTruthy();
      }
    );
  });
});

describe("clampCaptureAmount", () => {
  it("accepts an amount within the hold", () => {
    expect(clampCaptureAmount(50, 20000)).toEqual({ ok: true, amount: 50 });
  });

  it("accepts capturing the full hold", () => {
    expect(clampCaptureAmount(200, 20000)).toEqual({ ok: true, amount: 200 });
  });

  it("rejects more than the hold", () => {
    const result = clampCaptureAmount(250, 20000);
    expect(result.ok).toBe(false);
    expect(result.message).toContain("$200");
  });

  it("rejects zero and negative amounts", () => {
    expect(clampCaptureAmount(0, 20000).ok).toBe(false);
    expect(clampCaptureAmount(-5, 20000).ok).toBe(false);
  });

  it("rejects a non-numeric amount", () => {
    expect(clampCaptureAmount("abc", 20000).ok).toBe(false);
    expect(clampCaptureAmount(undefined, 20000).ok).toBe(false);
  });

  it("rejects any capture when the hold is unknown", () => {
    const result = clampCaptureAmount(50, undefined);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/could not/i);
  });

  it("accepts a numeric string from the form", () => {
    expect(clampCaptureAmount("50", 20000)).toEqual({ ok: true, amount: 50 });
  });
});
