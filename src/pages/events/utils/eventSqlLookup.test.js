import { describe, expect, it } from "vitest";
import {
  buildEventSqlLookup,
  eventSqlLookupFromEvent,
  pickOwnEventRow,
  zipFromAddress,
} from "./eventSqlLookup";

// GovRAMP AC-4. `POST /db_event/events_information` has no company condition
// of its own, so a body without the company column reads every company's
// matching rows (BACKEND_si11_three_routes_fixed_2026-11-17.md §2).

describe("zipFromAddress", () => {
  it("takes the last token", () => {
    expect(zipFromAddress("1200 Brickell Ave, Miami, FL 33131")).toBe("33131");
  });

  it("ignores trailing whitespace and double spaces", () => {
    expect(zipFromAddress("  Miami   FL   33131  ")).toBe("33131");
  });

  it("never throws on a missing address", () => {
    expect(zipFromAddress(undefined)).toBe("");
    expect(zipFromAddress(null)).toBe("");
    expect(zipFromAddress("")).toBe("");
  });
});

describe("buildEventSqlLookup", () => {
  it("always carries the company column", () => {
    expect(
      buildEventSqlLookup({ eventName: "Expo", address: "Main St 33131", companyId: 147 })
    ).toEqual({
      event_name: "Expo",
      zip_address: "33131",
      company_assigned_event_id: 147,
    });
  });

  it("accepts a numeric id of zero", () => {
    // 0 is falsy and would be dropped by a truthiness check.
    expect(buildEventSqlLookup({ eventName: "Expo", address: "x 1", companyId: 0 })).toMatchObject({
      company_assigned_event_id: 0,
    });
  });

  it("refuses to build an unscoped body", () => {
    // The point of this module: no company id means no request, rather than a
    // request that reads every company's events.
    expect(buildEventSqlLookup({ eventName: "Expo", address: "x 1" })).toBeNull();
    expect(buildEventSqlLookup({ eventName: "Expo", address: "x 1", companyId: null })).toBeNull();
    expect(buildEventSqlLookup({ eventName: "Expo", address: "x 1", companyId: "" })).toBeNull();
    expect(buildEventSqlLookup()).toBeNull();
  });
});

describe("eventSqlLookupFromEvent", () => {
  it("reads the name and address off the Mongo document", () => {
    const event = { eventInfoDetail: { eventName: "Expo", address: "Main St, Miami FL 33131" } };
    expect(eventSqlLookupFromEvent(event, 147)).toEqual({
      event_name: "Expo",
      zip_address: "33131",
      company_assigned_event_id: 147,
    });
  });

  it("refuses without a company id", () => {
    expect(eventSqlLookupFromEvent({ eventInfoDetail: { eventName: "Expo" } })).toBeNull();
  });
});

describe("pickOwnEventRow", () => {
  const rows = [
    { event_id: 1, company_assigned_event_id: 147 },
    { event_id: 2, company_assigned_event_id: 999 },
    { event_id: 3, company_assigned_event_id: "147" },
  ];

  it("never returns another company's row", () => {
    expect(pickOwnEventRow(rows, 147)).toEqual({ event_id: 3, company_assigned_event_id: "147" });
  });

  it("matches across string and number ids", () => {
    expect(pickOwnEventRow([{ event_id: 7, company_assigned_event_id: "147" }], 147)?.event_id).toBe(7);
  });

  it("returns null rather than the last row when nothing is ours", () => {
    // The bug this replaces: `rows.at(-1)` with no company check at all.
    expect(pickOwnEventRow(rows, 555)).toBeNull();
    expect(pickOwnEventRow([], 147)).toBeNull();
    expect(pickOwnEventRow(undefined, 147)).toBeNull();
  });
});
