import { describe, expect, it } from "vitest";
import { formatConsentExpiryMessage, shouldRetryTransientError } from "./consentPageUtils";

describe("shouldRetryTransientError", () => {
  it("does not retry a 404 (invalid link)", () => {
    expect(shouldRetryTransientError(0, { response: { status: 404 } })).toBe(false);
  });

  it("does not retry a 410 (expired link)", () => {
    expect(shouldRetryTransientError(0, { response: { status: 410 } })).toBe(false);
  });

  it("does not retry a 409/422 application error", () => {
    expect(shouldRetryTransientError(0, { response: { status: 409 } })).toBe(false);
    expect(shouldRetryTransientError(0, { response: { status: 422 } })).toBe(false);
  });

  it("retries a network error with no response up to 2 times", () => {
    expect(shouldRetryTransientError(0, { message: "Network Error" })).toBe(true);
    expect(shouldRetryTransientError(1, { message: "Network Error" })).toBe(true);
    expect(shouldRetryTransientError(2, { message: "Network Error" })).toBe(false);
  });

  it("retries a 500-level server error up to 2 times", () => {
    expect(shouldRetryTransientError(0, { response: { status: 500 } })).toBe(true);
    expect(shouldRetryTransientError(1, { response: { status: 503 } })).toBe(true);
    expect(shouldRetryTransientError(2, { response: { status: 500 } })).toBe(false);
  });
});

describe("formatConsentExpiryMessage", () => {
  it("returns null when expiresAt is missing", () => {
    expect(formatConsentExpiryMessage(null)).toBeNull();
    expect(formatConsentExpiryMessage(undefined)).toBeNull();
    expect(formatConsentExpiryMessage("")).toBeNull();
  });

  it("returns null for an invalid date string", () => {
    expect(formatConsentExpiryMessage("not-a-date")).toBeNull();
  });

  it("formats a valid ISO date into a human-readable expiry message", () => {
    // Noon UTC keeps this stable across CI/container timezones.
    expect(formatConsentExpiryMessage("2026-08-04T12:00:00.000Z")).toMatch(
      /This link expires on August 4, 2026\./
    );
  });
});
