import { describe, expect, it } from "vitest";
import { readLoginLockout } from "./loginLockout";

// FRONTEND_login_lockout_password_policy_2026-10-21.md §1.
const refused = (status, data, headers = {}) => ({ response: { status, data, headers } });

const LOCKED = {
  ok: false,
  msg: "Too many failed sign-in attempts. Try again later.",
  accountLocked: true,
  retryAfter: 1800,
};

describe("readLoginLockout", () => {
  it("reads the account lock and its wait in minutes", () => {
    expect(readLoginLockout(refused(429, LOCKED))).toEqual({
      kind: "account",
      retryAfterSeconds: 1800,
      message:
        "Your account is temporarily locked after too many failed sign-in attempts. Try again in 30 minutes.",
    });
  });

  it("rounds a partial minute up, and says one minute in the singular", () => {
    expect(readLoginLockout(refused(429, { ...LOCKED, retryAfter: 61 })).message).toMatch(
      /Try again in 2 minutes\.$/,
    );
    expect(readLoginLockout(refused(429, { ...LOCKED, retryAfter: 20 })).message).toMatch(
      /Try again in 1 minute\.$/,
    );
  });

  // Production CORS may not expose Retry-After, so the body comes first and
  // the header is only a fallback.
  it("falls back to the Retry-After header, then to no figure at all", () => {
    const { retryAfter, ...withoutBody } = LOCKED;
    expect(retryAfter).toBe(1800);
    expect(
      readLoginLockout(refused(429, withoutBody, { "retry-after": "600" })),
    ).toMatchObject({ retryAfterSeconds: 600, message: expect.stringMatching(/10 minutes\.$/) });
    expect(readLoginLockout(refused(429, withoutBody))).toEqual({
      kind: "account",
      retryAfterSeconds: null,
      message:
        "Your account is temporarily locked after too many failed sign-in attempts. Try again later.",
    });
  });

  // The older per-IP limit answers 429 without accountLocked.
  it("tells the per-IP rate limit apart from the account lock", () => {
    expect(readLoginLockout(refused(429, { msg: "Too many requests" }))).toEqual({
      kind: "rateLimit",
      retryAfterSeconds: null,
      message: "Too many sign-in attempts from this network. Wait a few minutes and try again.",
    });
  });

  it("ignores anything that is not a 429", () => {
    expect(readLoginLockout(refused(400, { msg: "Incorrect password" }))).toBeNull();
    expect(readLoginLockout(refused(401, { accountLocked: true }))).toBeNull();
    expect(readLoginLockout(new Error("Network Error"))).toBeNull();
    expect(readLoginLockout(undefined)).toBeNull();
  });
});
