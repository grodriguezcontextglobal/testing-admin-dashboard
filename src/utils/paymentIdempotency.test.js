import { describe, expect, it } from "vitest";
import { paymentIdempotencyHeaders } from "./paymentIdempotency";

describe("paymentIdempotencyHeaders", () => {
  // The hole the backend asked us to close: the capture amount is editable, so
  // two captures of the same deposit for different amounts are different
  // requests to a key derived from method, route and body — and both charge.
  // Keyed on the deposit, the second one gets the first one's answer instead.
  it("keys a capture on the deposit, not on the amount", () => {
    const first = paymentIdempotencyHeaders("capture", "pi_123");
    const second = paymentIdempotencyHeaders("capture", "pi_123");

    expect(first.headers["Idempotency-Key"]).toBe(second.headers["Idempotency-Key"]);
  });

  it("keeps the operations apart on the same deposit", () => {
    const capture = paymentIdempotencyHeaders("capture", "pi_123");
    const release = paymentIdempotencyHeaders("release", "pi_123");

    expect(capture.headers["Idempotency-Key"]).not.toBe(
      release.headers["Idempotency-Key"],
    );
  });

  it("keeps two deposits apart under the same operation", () => {
    expect(paymentIdempotencyHeaders("refund", "pi_123")).not.toEqual(
      paymentIdempotencyHeaders("refund", "pi_456"),
    );
  });

  it("names the operation and the deposit in the key, so a log can be read", () => {
    expect(paymentIdempotencyHeaders("capture", "pi_123").headers["Idempotency-Key"]).toBe(
      "capture:pi_123",
    );
  });

  // Without a payment intent there is nothing stable to key on, and a made-up
  // key is worse than none: it would let a real duplicate through while
  // claiming to prevent one.
  it("sends no header when there is no deposit to key on", () => {
    for (const missing of [undefined, null, ""]) {
      expect(paymentIdempotencyHeaders("capture", missing)).toEqual({});
    }
  });
});
