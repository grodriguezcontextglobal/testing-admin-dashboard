import { describe, expect, it } from "vitest";
import {
  buildItemAllocationPayload,
  describeItemAllocation,
  explainAllocationFailure,
  summarizeItemAllocation,
} from "./itemAllocation";

const event = () => ({
  id: "mongo-event-1",
  company_id: "company-mongo-1",
  company: "Invoxia",
  sql: { event_id: 42 },
  eventInfoDetail: { eventName: "Spring Expo" },
  deviceSetup: [
    { group: "Receiver", category: "Audio" },
    { group: "Laptop", category: "Electronics" },
  ],
});

const user = () => ({ sqlInfo: { company_id: 137 } });

describe("buildItemAllocationPayload", () => {
  it("sends every key the endpoint reads, unchanged", () => {
    expect(
      buildItemAllocationPayload({
        event: event(),
        deviceTitle: "Receiver",
        user: user(),
        batch: ["RX-100001", "RX-100002"],
      }),
    ).toEqual({
      category_name: "Audio",
      company_id: 137,
      data: ["RX-100001", "RX-100002"],
      event_id: 42,
      item_group: "Receiver",
      logistic_status: "in-event",
      warehouse: 0,
    });
  });

  it("reads the category from the matching device-setup group, not the first one", () => {
    const payload = buildItemAllocationPayload({
      event: event(),
      deviceTitle: "Laptop",
      user: user(),
      batch: ["SN-100003"],
    });
    expect(payload.category_name).toBe("Electronics");
    expect(payload.item_group).toBe("Laptop");
  });

  // The endpoint requires all four of company/group/category/serial to match,
  // so a group missing from the setup sends category_name undefined and every
  // serial comes back unresolved. Naming it beats a bare TypeError mid-batch.
  it("fails with a readable message when the group is not in the event setup", () => {
    expect(() =>
      buildItemAllocationPayload({
        event: event(),
        deviceTitle: "Not In Setup",
        user: user(),
        batch: ["X-1"],
      }),
    ).toThrow(/Not In Setup/);
  });

  it("names the group even when the event carries no device setup at all", () => {
    expect(() =>
      buildItemAllocationPayload({
        event: { ...event(), deviceSetup: undefined },
        deviceTitle: "Receiver",
        user: user(),
        batch: ["RX-100001"],
      }),
    ).toThrow(/Receiver/);
  });
});

describe("summarizeItemAllocation", () => {
  const requested = ["RX-100001", "RX-100002", "RX-999999"];

  it("reads the partial-match fields the endpoint now returns", () => {
    const summary = summarizeItemAllocation(
      {
        ok: true,
        requested_count: 3,
        matched_count: 2,
        unresolved_serials: ["RX-999999"],
        result: [
          { item_id: 200574, serial_number: "RX-100001" },
          { item_id: 200575, serial_number: "RX-100002" },
        ],
        inserted: { inserted_items: 2, total_items: 2 },
      },
      requested,
    );

    expect(summary).toEqual({
      requestedCount: 3,
      matchedCount: 2,
      insertedCount: 2,
      unresolvedSerials: ["RX-999999"],
      allocatedSerials: ["RX-100001", "RX-100002"],
      fullyAllocated: false,
    });
  });

  // The whole point of the change: a 200 with 2 of 3 resolved used to be
  // reported as a complete success, so the event went out a device short.
  it("does not call a partial match fully allocated", () => {
    const summary = summarizeItemAllocation(
      { ok: true, matched_count: 2, requested_count: 3 },
      requested,
    );
    expect(summary.fullyAllocated).toBe(false);
  });

  it("counts what we asked for ourselves, never the server's total_items", () => {
    // §4: inserted.total_items is the MATCHED count, not the requested one.
    // Trusting it would report "2 of 2" for a batch of 3.
    const summary = summarizeItemAllocation(
      { ok: true, inserted: { inserted_items: 2, total_items: 2 } },
      requested,
    );
    expect(summary.requestedCount).toBe(3);
    expect(summary.insertedCount).toBe(2);
  });

  it("keeps unresolved serials out of the allocated list", () => {
    const summary = summarizeItemAllocation(
      { ok: true, unresolved_serials: ["RX-999999"] },
      requested,
    );
    expect(summary.allocatedSerials).toEqual(["RX-100001", "RX-100002"]);
  });

  it("allocates nothing when the server reports it matched nothing", () => {
    const summary = summarizeItemAllocation(
      { ok: true, matched_count: 0, result: [] },
      requested,
    );
    expect(summary.allocatedSerials).toEqual([]);
    expect(summary.fullyAllocated).toBe(false);
  });

  it("ignores serials the response names but we never sent", () => {
    const summary = summarizeItemAllocation(
      { ok: true, result: [{ serial_number: "RX-100001" }, { serial_number: "SOMEONE-ELSE" }] },
      requested,
    );
    expect(summary.allocatedSerials).toEqual(["RX-100001"]);
  });

  // Before the hardening release lands, a 200 carries none of these fields and
  // did mean every serial resolved. Treating that as "nothing allocated" would
  // stop writing the receivers pool on the currently deployed server.
  it("treats a legacy response with no counts as a full success", () => {
    const summary = summarizeItemAllocation({ ok: true }, requested);
    expect(summary.allocatedSerials).toEqual(requested);
    expect(summary.unresolvedSerials).toEqual([]);
    expect(summary.fullyAllocated).toBe(true);
    expect(summary.matchedCount).toBeNull();
  });

  it("survives a missing or non-object response", () => {
    for (const value of [undefined, null, "", 0]) {
      const summary = summarizeItemAllocation(value, requested);
      expect(summary.allocatedSerials).toEqual(requested);
      expect(summary.fullyAllocated).toBe(true);
    }
  });

  it("reports an empty batch as fully allocated without inventing counts", () => {
    const summary = summarizeItemAllocation({ ok: true }, []);
    expect(summary).toEqual({
      requestedCount: 0,
      matchedCount: null,
      insertedCount: null,
      unresolvedSerials: [],
      allocatedSerials: [],
      fullyAllocated: true,
    });
  });

  it("does not treat a non-array unresolved_serials as a finding", () => {
    const summary = summarizeItemAllocation(
      { ok: true, unresolved_serials: "RX-999999" },
      requested,
    );
    expect(summary.unresolvedSerials).toEqual([]);
  });
});

describe("describeItemAllocation", () => {
  it("reports the total moved when every batch resolved completely", () => {
    const outcome = describeItemAllocation(
      [
        summarizeItemAllocation({ ok: true, matched_count: 2 }, ["A", "B"]),
        summarizeItemAllocation({ ok: true, matched_count: 1 }, ["C"]),
      ],
      "Receiver",
    );
    expect(outcome.complete).toBe(true);
    expect(outcome.headline).toMatch(/3 items/);
    expect(outcome.detail).toBeNull();
  });

  it("names the skipped serials across batches when something did not resolve", () => {
    const outcome = describeItemAllocation(
      [
        summarizeItemAllocation(
          { ok: true, matched_count: 1, unresolved_serials: ["00100003"] },
          ["RX-100001", "00100003"],
        ),
      ],
      "Receiver",
    );
    expect(outcome.complete).toBe(false);
    expect(outcome.headline).toMatch(/1 of 2/);
    expect(outcome.detail).toContain("00100003");
    expect(outcome.detail).toContain("Receiver");
  });

  it("uses singular wording for a single item", () => {
    const outcome = describeItemAllocation(
      [summarizeItemAllocation({ ok: true, matched_count: 1 }, ["A"])],
      "Receiver",
    );
    expect(outcome.headline).toMatch(/1 item /);
  });

  it("falls back to what we sent when no batch reported a matched count", () => {
    const outcome = describeItemAllocation(
      [summarizeItemAllocation({ ok: true }, ["A", "B"])],
      "Receiver",
    );
    expect(outcome.complete).toBe(true);
    expect(outcome.headline).toMatch(/2 items/);
  });

  it("says nothing was sent for an empty run rather than rendering a 0", () => {
    const outcome = describeItemAllocation([], "Receiver");
    expect(outcome.headline).toMatch(/[Nn]o serial numbers/);
    expect(outcome.complete).toBe(true);
  });
});

describe("explainAllocationFailure", () => {
  const failure = (status, data) => ({
    isAxiosError: true,
    message: `Request failed with status code ${status}`,
    response: { status, data },
  });

  // The 422 replaces a 500 that the UI could not tell from an outage, and it
  // is the answer to the 00100003 report: that serial is a Laptop, so it never
  // matches the Receiver group.
  it("names the serials that matched nothing on a 422", () => {
    const message = explainAllocationFailure(
      failure(422, {
        msg: "No items to allocate",
        ok: false,
        unresolved_serials: ["00100003"],
        requested_count: 1,
        matched_count: 0,
      }),
      "Receiver",
    );
    expect(message).toContain("00100003");
    expect(message).toContain("Receiver");
    expect(message).not.toMatch(/status code/);
  });

  it("lists every unresolved serial, not just the first", () => {
    const message = explainAllocationFailure(
      failure(422, { unresolved_serials: ["A-1", "A-2", "A-3"] }),
      "Receiver",
    );
    expect(message).toContain("A-1");
    expect(message).toContain("A-2");
    expect(message).toContain("A-3");
  });

  it("falls back to the server message when no serials are named", () => {
    expect(explainAllocationFailure(failure(400, { msg: "event_id is required" }), "Receiver")).toContain(
      "event_id is required",
    );
  });

  // A 500 is the server's fault, not the payload's — the old behaviour for a
  // wrong serial. Do not tell the user to check their serial numbers for it.
  it("keeps a server fault distinguishable from a bad payload", () => {
    const message = explainAllocationFailure(failure(500, { msg: "Server error" }), "Receiver");
    expect(message).not.toMatch(/serial number.*match/i);
  });

  it("survives a network error with no response at all", () => {
    const message = explainAllocationFailure(
      { isAxiosError: true, message: "Network Error" },
      "Receiver",
    );
    expect(message).toContain("Network Error");
  });

  it("never returns an empty string", () => {
    for (const value of [undefined, null, {}, new Error("")]) {
      expect(explainAllocationFailure(value, "Receiver").trim().length).toBeGreaterThan(0);
    }
  });
});
