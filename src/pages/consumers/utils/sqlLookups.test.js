import { describe, expect, it } from "vitest";

import { firstRecord } from "./sqlLookups";

/* 2026-10-19, BACKEND_fedramp_server_tasks_REPLY_2026-10-19.md: ExpandedRow
   and TransactionTableRefactoring read `consumer[0]` and `lease[0]` without
   checking. A consumer with no SQL row, an empty lease list or a refused
   lookup turned into a TypeError instead of a message. */
describe("firstRecord", () => {
  it("returns the first row of the list the response carries", () => {
    const response = { data: { ok: true, consumer: [{ consumer_id: 7 }, { consumer_id: 8 }] } };
    expect(firstRecord(response, "consumer")).toEqual({ consumer_id: 7 });
  });

  it("is null for an empty list, a missing list or a missing response", () => {
    expect(firstRecord({ data: { ok: true, consumer: [] } }, "consumer")).toBeNull();
    expect(firstRecord({ data: { ok: true } }, "consumer")).toBeNull();
    expect(firstRecord(undefined, "consumer")).toBeNull();
    expect(firstRecord({ data: { ok: true, consumer: "x" } }, "consumer")).toBeNull();
  });

  it("is null when the server said no, even with rows", () => {
    expect(firstRecord({ data: { ok: false, lease: [{ lease_id: 1 }] } }, "lease")).toBeNull();
  });

  it("does not require an ok flag, which some lookups leave out", () => {
    expect(firstRecord({ data: { items: [{ item_id: 3 }] } }, "items")).toEqual({ item_id: 3 });
  });
});
