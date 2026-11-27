import { describe, it, expect } from "vitest";
import { isNotDeployed, notServedFrom, notServedText, retryPlatformQuery } from "./platformQuery";

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

  // 501 is a refusal wearing a 5xx. "I do not serve this" is as true on the
  // third ask as on the first, and the Merchant tab spent ~8 seconds loading
  // to find that out (backend note, 2026-11-26).
  it("gives up at once on a 501, unlike every other 5xx", () => {
    expect(retryPlatformQuery(0, withStatus(501))).toBe(false);
    expect(retryPlatformQuery(0, withStatus(502))).toBe(true);
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

describe("isNotDeployed", () => {
  it("is a 404 and nothing else", () => {
    expect(isNotDeployed(withStatus(404))).toBe(true);
    expect(isNotDeployed(withStatus(501))).toBe(false);
    expect(isNotDeployed(withStatus(500))).toBe(false);
    expect(isNotDeployed(new Error("Network Error"))).toBe(false);
    expect(isNotDeployed(undefined)).toBe(false);
  });
});

describe("notServedFrom", () => {
  const refusal = (data) => ({ response: { status: 501, data } });

  const MERCHANT = {
    ok: false,
    resource: "merchant",
    msg: "Merchant status is held by Stripe, not by this server.",
    needs: ["a Stripe API call per client (account, balance, payouts)", "a cache with a TTL"],
  };

  it("reads the refusal the server sends for a resource it does not hold", () => {
    expect(notServedFrom(refusal(MERCHANT))).toEqual({
      resource: "merchant",
      message: "Merchant status is held by Stripe, not by this server.",
      needs: [
        "a Stripe API call per client (account, balance, payouts)",
        "a cache with a TTL",
      ],
    });
  });

  it("is null for every status that is not 501", () => {
    // A 404 is "I have not built this"; a 500 is a fault. Only 501 means
    // "this data is not mine to give", and only it gets this state.
    expect(notServedFrom(withStatus(404))).toBeNull();
    expect(notServedFrom(withStatus(500))).toBeNull();
    expect(notServedFrom(new Error("Network Error"))).toBeNull();
    expect(notServedFrom(null)).toBeNull();
  });

  it("survives a 501 with nothing useful in it", () => {
    expect(notServedFrom(refusal(undefined))).toEqual({ resource: null, message: null, needs: [] });
    expect(notServedFrom(refusal({ resource: 7, msg: "  ", needs: "soon" }))).toEqual({
      resource: null,
      message: null,
      needs: [],
    });
  });

  it("keeps only the needs that are text worth showing", () => {
    expect(notServedFrom(refusal({ needs: ["a Stripe call", "", 4, null, "  a cache "] })).needs).toEqual([
      "a Stripe call",
      "a cache",
    ]);
  });
});

describe("notServedText", () => {
  it("says the server's own words, then what it is waiting on", () => {
    expect(
      notServedText({ message: "Merchant status is held by Stripe.", needs: ["a Stripe call", "a cache"] }),
    ).toBe("Merchant status is held by Stripe. Waiting on: a Stripe call; a cache.");
  });

  it("is the message alone when nothing is listed", () => {
    expect(notServedText({ message: "Held by Stripe.", needs: [] })).toBe("Held by Stripe.");
  });

  it("falls back to a sentence of our own when the server sent no message", () => {
    expect(notServedText({ message: null, needs: [] })).toBe(
      "The server does not serve this data yet. Nothing was changed.",
    );
  });

  it("still lists the needs when there is no message", () => {
    expect(notServedText({ message: null, needs: ["a Stripe call"] })).toBe(
      "The server does not serve this data yet. Nothing was changed. Waiting on: a Stripe call.",
    );
  });
});
