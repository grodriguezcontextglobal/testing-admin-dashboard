import { describe, expect, it } from "vitest";
import { NOT_FOUND_MESSAGE, TOO_MANY_ATTEMPTS_MESSAGE, myDevicesLookupError } from "./myDevicesLookup";

// FRONTEND_fedramp_a2_lote2_2026-10-27 (AC-7): /db_member/my-devices allows
// 10 lookups per IP every 15 minutes and answers 429 after that.
const failure = (status, data) => ({ response: { status, data } });

describe("myDevicesLookupError", () => {
  it("says to wait on a 429, whatever the body", () => {
    expect(myDevicesLookupError(failure(429))).toBe(TOO_MANY_ATTEMPTS_MESSAGE);
    expect(myDevicesLookupError(failure(429, "Too many requests"))).toBe(TOO_MANY_ATTEMPTS_MESSAGE);
    expect(TOO_MANY_ATTEMPTS_MESSAGE).toBe("Too many attempts. Please try again later.");
  });

  it("shows the server's message otherwise", () => {
    expect(myDevicesLookupError(failure(404, { msg: "No match." }))).toBe("No match.");
  });

  it("falls back to the not-found message", () => {
    expect(myDevicesLookupError(failure(404, {}))).toBe(NOT_FOUND_MESSAGE);
    expect(myDevicesLookupError(new Error("Network Error"))).toBe(NOT_FOUND_MESSAGE);
  });
});
