import { describe, expect, it } from "vitest";
import {
  EVENT_DEVICE_QUERY_KEYS,
  eventCacheKeys,
} from "./eventInventoryRefresh";

const args = { eventId: "ev-1", eventName: "Expo 2026", companyId: "co-9" };

describe("eventCacheKeys", () => {
  it("clears the key in both forms the server may have stored it under", () => {
    // The same data is requested by event id in some places and by event name
    // in others, so the cached response can sit under either.
    expect(eventCacheKeys(args)).toEqual([
      "eventSelected=ev-1&company=co-9",
      "eventSelected=Expo 2026&company=co-9",
    ]);
  });

  it("keys on the company id, which is what every request sends", () => {
    // Not the company name. Every call that WRITES this cache -- the pool list
    // in MainPageQuickGlance, GraphicInventoryEventActivity, SpreadSheet,
    // FormatToDisplayDetail -- sends `company=<companyData.id>`. A key built
    // from a name clears nothing, whatever the name field is called.
    expect(eventCacheKeys(args).every((key) => key.endsWith("company=co-9"))).toBe(
      true
    );
  });

  it("never emits a key with `undefined` in it", () => {
    // The bug this replaces: a key was built from `companyData.companyName`, a
    // field the session does not carry, so the app posted
    // "company=undefined" and cleared a key nobody had ever written.
    const cases = [
      { ...args, companyId: undefined },
      { ...args, eventId: undefined },
      { ...args, eventName: undefined },
      { eventId: null, eventName: null, companyId: null },
      {},
      undefined,
    ];
    cases.forEach((input) => {
      eventCacheKeys(input).forEach((key) => {
        expect(key).not.toContain("undefined");
        expect(key).not.toContain("null");
      });
    });
  });

  it("drops the form whose reference is missing instead of faking it", () => {
    expect(eventCacheKeys({ ...args, eventName: "" })).toEqual([
      "eventSelected=ev-1&company=co-9",
    ]);
    expect(eventCacheKeys({ ...args, eventId: "" })).toEqual([
      "eventSelected=Expo 2026&company=co-9",
    ]);
  });

  it("clears nothing without a company, because nothing is keyed without one", () => {
    expect(eventCacheKeys({ eventId: "ev-1", eventName: "Expo 2026" })).toEqual(
      []
    );
  });
});

describe("EVENT_DEVICE_QUERY_KEYS", () => {
  it("names the query that actually feeds this table", () => {
    // The refresh button used to invalidate "deviceInPoolList" only, which is
    // registered by ReplaceDevice -- a different component. The table under
    // the button is fed by `listOfreceiverInPool` in MainPageQuickGlance, so
    // pressing Refresh cleared the server cache and then never refetched.
    expect(EVENT_DEVICE_QUERY_KEYS).toContainEqual(["listOfreceiverInPool"]);
  });

  it("keeps the pool list the old code was reaching for", () => {
    expect(EVENT_DEVICE_QUERY_KEYS).toContainEqual(["deviceInPoolList"]);
  });

  it("is a list of arrays, so each one matches by prefix", () => {
    // Two reasons this matters, and the old call broke both: a react-query v4
    // key must be an array -- a bare string hashes to something else entirely
    // -- and `deviceInPoolList` is registered as
    // ["deviceInPoolList", companyId], so only a prefix match reaches it.
    // `exact: true` on a one-element key never could.
    EVENT_DEVICE_QUERY_KEYS.forEach((key) => {
      expect(Array.isArray(key)).toBe(true);
      expect(key).toHaveLength(1);
      expect(typeof key[0]).toBe("string");
    });
  });
});
