import { describe, expect, it } from "vitest";
import {
  describePaymentError,
  isPaymentRequestInProgress,
} from "./paymentRequestState";

const conflict = { response: { status: 409 } };

describe("isPaymentRequestInProgress", () => {
  it("is true for a 409", () => {
    expect(isPaymentRequestInProgress(conflict)).toBe(true);
  });

  // Everything else is a real failure. A 400 or a 500 says the money did not
  // move; only the 409 says the first request is still deciding.
  it("is false for every other status", () => {
    expect(isPaymentRequestInProgress({ response: { status: 400 } })).toBe(false);
    expect(isPaymentRequestInProgress({ response: { status: 500 } })).toBe(false);
  });

  // A dropped connection has no response at all. It is not a conflict, and
  // reading `.status` off undefined is how this kind of helper usually breaks.
  it("is false when the request never got a response", () => {
    expect(isPaymentRequestInProgress({ message: "Network Error" })).toBe(false);
    expect(isPaymentRequestInProgress(undefined)).toBe(false);
  });
});

describe("describePaymentError", () => {
  it("reads a 409 as the previous request still running", () => {
    const result = describePaymentError(conflict, {
      failure: "The deposit was not captured. Nothing was charged.",
      subject: "capture",
    });

    expect(result.inProgress).toBe(true);
    expect(result.message).toContain("capture");
  });

  // The whole reason this file exists. The 409 arrives while the first request
  // is still running, and that request may well charge the card — so the one
  // thing the screen must never do is promise that nothing happened.
  it("never claims nothing was charged on a 409", () => {
    const result = describePaymentError(conflict, {
      failure: "The refund failed. Nothing was charged back.",
      subject: "refund",
    });

    expect(result.message).not.toMatch(/nothing was charged/i);
    expect(result.message).not.toMatch(/failed/i);
  });

  it("hands back the caller's own wording for a real failure", () => {
    const result = describePaymentError(
      { response: { status: 402 } },
      { failure: "The deposit was not captured. Nothing was charged.", subject: "capture" },
    );

    expect(result.inProgress).toBe(false);
    expect(result.message).toBe(
      "The deposit was not captured. Nothing was charged.",
    );
  });

  it("falls back to a neutral subject", () => {
    expect(describePaymentError(conflict, { failure: "It failed." }).message).toContain(
      "request",
    );
  });
});
