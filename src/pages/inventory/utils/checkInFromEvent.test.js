import { describe, expect, it } from "vitest";
import {
  addScannedSerial,
  addScannedSerials,
  buildCheckInPayload,
  countSummary,
  checkInBlockers,
  expectedSerials,
  nearMiss,
  reconcile,
  reconciliationRows,
} from "./checkInFromEvent";

const inventory = [
  { device: "SN-001", type: "Receiver" },
  { device: "SN-002", type: "Receiver" },
  { device: "CH-001", type: "Charger" },
];

describe("expectedSerials", () => {
  it("lists the serials the event is waiting on", () => {
    expect(expectedSerials(inventory)).toEqual(["SN-001", "SN-002", "CH-001"]);
  });

  it("counts a device that appears under two groups once", () => {
    expect(
      expectedSerials([...inventory, { device: "SN-001", type: "Spare" }])
    ).toHaveLength(3);
  });

  it("survives a missing list and rows with no device", () => {
    expect(expectedSerials(undefined)).toEqual([]);
    expect(expectedSerials([{ type: "Receiver" }])).toEqual([]);
  });
});

describe("addScannedSerial", () => {
  it("adds a serial and says so", () => {
    const result = addScannedSerial([], " SN-001 ");
    expect(result.outcome).toBe("added");
    expect(result.list).toEqual(["SN-001"]);
  });

  it("reports a duplicate instead of silently doing nothing", () => {
    // The old input dropped a re-scan on the floor with no feedback, which
    // reads exactly like the scanner failing to fire.
    const result = addScannedSerial(["SN-001"], "SN-001");
    expect(result.outcome).toBe("duplicate");
    expect(result.list).toEqual(["SN-001"]);
  });

  it("ignores an empty scan", () => {
    expect(addScannedSerial(["SN-001"], "   ").outcome).toBe("empty");
  });

  it("keeps the newest scan first so the operator sees it without scrolling", () => {
    expect(addScannedSerial(["SN-001"], "SN-002").list).toEqual(["SN-002", "SN-001"]);
  });
});

describe("reconcile", () => {
  it("splits the scans three ways", () => {
    const result = reconcile(inventory, ["SN-001", "XX-999"]);
    expect(result.matched).toEqual(["SN-001"]);
    expect(result.missing).toEqual(["SN-002", "CH-001"]);
    expect(result.extra).toEqual(["XX-999"]);
  });

  it("matches on the exact serial, as the check-in has always done", () => {
    // Sending a serial the server does not store under that casing would fail
    // server-side, so the match stays exact; `nearMiss` explains the miss.
    expect(reconcile(inventory, ["sn-001"]).matched).toEqual([]);
    expect(reconcile(inventory, ["sn-001"]).extra).toEqual(["sn-001"]);
  });

  it("is everything-missing before a single scan", () => {
    expect(reconcile(inventory, []).missing).toHaveLength(3);
    expect(reconcile(inventory, []).matched).toEqual([]);
  });

  it("survives nothing on either side", () => {
    expect(reconcile(undefined, undefined)).toEqual({
      matched: [],
      missing: [],
      extra: [],
    });
  });
});

describe("nearMiss", () => {
  it("names the serial that differs only in casing", () => {
    expect(nearMiss(inventory, "sn-002")).toBe("SN-002");
  });

  it("ignores surrounding space", () => {
    expect(nearMiss(inventory, " SN-002 ")).toBeNull();
  });

  it("is null for a serial that really is not in the event", () => {
    expect(nearMiss(inventory, "XX-999")).toBeNull();
  });
});

describe("reconciliationRows", () => {
  it("gives every expected device a status and keeps its group", () => {
    const rows = reconciliationRows(inventory, ["SN-001"]);
    expect(rows).toHaveLength(3);
    expect(rows.find((row) => row.serial === "SN-001").status).toBe("scanned");
    expect(rows.find((row) => row.serial === "CH-001").status).toBe("missing");
    expect(rows.find((row) => row.serial === "CH-001").type).toBe("Charger");
  });

  it("appends what was scanned but does not belong to the event", () => {
    const rows = reconciliationRows(inventory, ["XX-999"]);
    const extra = rows.find((row) => row.serial === "XX-999");
    expect(extra.status).toBe("extra");
    expect(extra.type).toBe("—");
  });

  it("sorts the ones still missing to the top, since those are the work", () => {
    expect(reconciliationRows(inventory, ["SN-001"])[0].status).toBe("missing");
  });

  it("gives each row a stable key", () => {
    const keys = reconciliationRows(inventory, ["XX-999"]).map((row) => row.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("buildCheckInPayload", () => {
  it("keeps the exact body POST /api/db_event/confirm-item-return accepts", () => {
    expect(
      buildCheckInPayload({
        companyId: 7,
        location: "Warehouse A",
        matched: ["SN-001"],
        noSqlCompanyId: "co-1",
        eventName: "Expo 2026",
        subLocations: new Set(["Shelf 1"]),
        userId: 42,
      })
    ).toEqual({
      company_id: 7,
      location: "Warehouse A",
      noSqlCompanyId: "co-1",
      noSqlEventName: "Expo 2026",
      serial_numbers: ["SN-001"],
      sub_location: ["Shelf 1"],
      user_id: 42,
    });
  });

  it("sends sub_location as an array even when nothing was picked", () => {
    const payload = buildCheckInPayload({ subLocations: undefined });
    expect(payload.sub_location).toEqual([]);
    expect(payload.serial_numbers).toEqual([]);
  });

  it("adds no field the endpoint does not declare", () => {
    expect(Object.keys(buildCheckInPayload({})).sort()).toEqual([
      "company_id",
      "location",
      "noSqlCompanyId",
      "noSqlEventName",
      "serial_numbers",
      "sub_location",
      "user_id",
    ]);
  });
});

describe("checkInBlockers", () => {
  const ready = { eventName: "Expo", location: "Warehouse A", matchedCount: 2 };

  it("is empty when the form is ready", () => {
    expect(checkInBlockers(ready)).toEqual([]);
  });

  it("names what is missing rather than firing one toast per submit", () => {
    expect(checkInBlockers({ ...ready, location: null })).toEqual([
      "Pick where the devices are being stored.",
    ]);
    expect(checkInBlockers({ ...ready, eventName: null })).toEqual([
      "Pick the event the devices came back from.",
    ]);
  });

  it("blocks a check-in that would send an empty serial list", () => {
    // The old footer hid the button instead, so nothing explained the wait.
    expect(checkInBlockers({ ...ready, matchedCount: 0 })).toEqual([
      "Scan at least one device that belongs to this event.",
    ]);
  });

  it("lists every blocker at once", () => {
    expect(checkInBlockers({})).toHaveLength(3);
  });
});

/* ─────────────────────────── a whole pass at once, not one trigger pull ── */

describe("addScannedSerials", () => {
  it("adds a batch and keeps the newest-first order of the single version", () => {
    const result = addScannedSerials([], ["SN-001", "SN-002"]);
    expect(result.list).toEqual(["SN-002", "SN-001"]);
    expect(result.added).toEqual(["SN-001", "SN-002"]);
    expect(result.duplicates).toEqual([]);
  });

  it("merges into a list that already has scans", () => {
    const result = addScannedSerials(["SN-001"], ["SN-002"]);
    expect(result.list).toEqual(["SN-002", "SN-001"]);
  });

  it("counts a serial repeated inside the batch once", () => {
    // A bulk read hears the same device many times in one pass.
    const result = addScannedSerials([], ["SN-001", "SN-001", "SN-002"]);
    expect(result.added).toEqual(["SN-001", "SN-002"]);
    expect(result.duplicates).toEqual(["SN-001"]);
    expect(result.list).toHaveLength(2);
  });

  it("reports a serial already on the list without adding it twice", () => {
    const result = addScannedSerials(["SN-001"], ["SN-001", "SN-002"]);
    expect(result.added).toEqual(["SN-002"]);
    expect(result.duplicates).toEqual(["SN-001"]);
    expect(result.list).toEqual(["SN-002", "SN-001"]);
  });

  it("reports empty values instead of adding blanks", () => {
    const result = addScannedSerials([], ["SN-001", "", "  ", null]);
    expect(result.added).toEqual(["SN-001"]);
    expect(result.empty).toBe(3);
  });

  it("trims each value, like the single version does", () => {
    expect(addScannedSerials([], [" SN-001 "]).added).toEqual(["SN-001"]);
  });

  it("survives a missing batch or a missing list", () => {
    expect(addScannedSerials(undefined, undefined).list).toEqual([]);
    expect(addScannedSerials(["SN-001"], undefined).list).toEqual(["SN-001"]);
    expect(addScannedSerials(undefined, ["SN-001"]).list).toEqual(["SN-001"]);
  });

  it("takes a pallet-sized batch without degrading", () => {
    // The reason this exists at all: addScannedSerial checks the list with
    // includes(), so filing 500 devices one call at a time is 125,000 string
    // comparisons. This is one pass with a Set.
    const batch = Array.from({ length: 500 }, (_, i) => `SN-${i}`);
    const result = addScannedSerials([], [...batch, ...batch]);
    expect(result.added).toHaveLength(500);
    expect(result.duplicates).toHaveLength(500);
    expect(result.list).toHaveLength(500);
  });
});

/* ──────────────────────────── the number recorded when an event closes ── */

describe("countSummary", () => {
  it("reports the count an operator is asked for at close", () => {
    const summary = countSummary(inventory, ["SN-001", "SN-002"]);
    expect(summary).toEqual({
      expected: 3,
      counted: 2,
      matched: 2,
      missing: 1,
      extra: 0,
      complete: false,
    });
  });

  it("is complete only when nothing is still expected", () => {
    const summary = countSummary(inventory, ["SN-001", "SN-002", "CH-001"]);
    expect(summary.complete).toBe(true);
    expect(summary.missing).toBe(0);
  });

  it("counts a device from another event as counted but not matched", () => {
    // It was physically on the pallet, so it was counted; it is not part of
    // this event's return, so it cannot close a line on it.
    const summary = countSummary(inventory, ["SN-001", "OTHER-9"]);
    expect(summary.counted).toBe(2);
    expect(summary.matched).toBe(1);
    expect(summary.extra).toBe(1);
    expect(summary.complete).toBe(false);
  });

  it("does not call an empty event complete on an empty count", () => {
    // Nothing expected and nothing scanned is a screen nobody used, not a
    // finished count. Saying "complete" there would file a closed event that
    // was never reconciled.
    const summary = countSummary([], []);
    expect(summary.expected).toBe(0);
    expect(summary.counted).toBe(0);
    expect(summary.complete).toBe(false);
  });

  it("survives missing arguments", () => {
    expect(countSummary(undefined, undefined).expected).toBe(0);
  });
});
