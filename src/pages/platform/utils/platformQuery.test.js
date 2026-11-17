import { describe, it, expect } from "vitest";
import { retryPlatformQuery } from "./platformQuery";

const withStatus = (status) => ({ response: { status } });

describe("retryPlatformQuery", () => {
  // The console's whole error vocabulary is built on 404 ("the server does
  // not have this yet"). Retrying one costs the user ~8 seconds of loading
  // skeleton before being told something the first answer already said.
  it("gives up at once on a 404", () => {
    expect(retryPlatformQuery(0, withStatus(404))).toBe(false);
  });

  it("gives up at once on the other refusals", () => {
    for (const status of [400, 401, 403, 422]) {
      expect(retryPlatformQuery(0, withStatus(status))).toBe(false);
    }
  });

  // Waiting is the right answer to these two, not giving up.
  it("retries a timeout and a rate limit", () => {
    expect(retryPlatformQuery(0, withStatus(408))).toBe(true);
    expect(retryPlatformQuery(0, withStatus(429))).toBe(true);
  });

  it("retries a server error, twice at most", () => {
    expect(retryPlatformQuery(0, withStatus(500))).toBe(true);
    expect(retryPlatformQuery(1, withStatus(503))).toBe(true);
    expect(retryPlatformQuery(2, withStatus(500))).toBe(false);
  });

  it("retries an error with no answer at all, which is the network", () => {
    expect(retryPlatformQuery(0, new Error("Network Error"))).toBe(true);
    expect(retryPlatformQuery(2, new Error("Network Error"))).toBe(false);
  });

  it("does not trip over a status that is not a number", () => {
    expect(retryPlatformQuery(0, { response: { status: "404" } })).toBe(true);
    expect(retryPlatformQuery(0, null)).toBe(true);
  });
});
