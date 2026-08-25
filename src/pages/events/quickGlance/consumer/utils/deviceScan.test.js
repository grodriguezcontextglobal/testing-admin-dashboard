import { describe, expect, it } from "vitest";
import {
  availableSerialsForGroup,
  describeScan,
  summarizeSelection,
} from "./deviceScan";

const pool = [
  { id: "p1", device: "RRRRR001", type: "tablet", activity: false, status: "Operational" },
  { id: "p2", device: "RRRRR002", type: "tablet", activity: false, status: "Operational" },
  { id: "p3", device: "RRRRR003", type: "tablet", activity: true, status: "Operational" },
  { id: "p4", device: "RRRRR004", type: "tablet", activity: false, status: "Lost" },
  { id: "p5", device: "HHHHH001", type: "headset", activity: false, status: "Operational" },
];

describe("availableSerialsForGroup", () => {
  it("returns only the free, non-lost serials of that type", () => {
    expect(availableSerialsForGroup(pool, "tablet")).toEqual([
      "RRRRR001",
      "RRRRR002",
    ]);
  });

  it("excludes a device already out with someone else", () => {
    expect(availableSerialsForGroup(pool, "tablet")).not.toContain("RRRRR003");
  });

  it("excludes a written-off device", () => {
    expect(availableSerialsForGroup(pool, "tablet")).not.toContain("RRRRR004");
  });

  it("matches the device type case-insensitively", () => {
    expect(availableSerialsForGroup(pool, "Tablet")).toHaveLength(2);
  });

  it("returns the serials in human order", () => {
    const messy = [
      { device: "RRRRR010", type: "tablet", activity: false },
      { device: "RRRRR002", type: "tablet", activity: false },
    ];
    expect(availableSerialsForGroup(messy, "tablet")).toEqual([
      "RRRRR002",
      "RRRRR010",
    ]);
  });

  it("returns nothing for an unknown type", () => {
    expect(availableSerialsForGroup(pool, "projector")).toEqual([]);
  });

  it("survives a missing pool or group", () => {
    expect(availableSerialsForGroup(undefined, "tablet")).toEqual([]);
    expect(availableSerialsForGroup(pool, undefined)).toEqual([]);
  });

  it("treats a record with no activity flag as available", () => {
    const loose = [{ device: "X1", type: "tablet" }];
    expect(availableSerialsForGroup(loose, "tablet")).toEqual(["X1"]);
  });
});

describe("describeScan", () => {
  const scan = (serial, picked = []) =>
    describeScan({ serial, pool, group: "tablet", picked });

  it("accepts a free device of the right type", () => {
    const result = scan("RRRRR001");
    expect(result.ok).toBe(true);
    expect(result.code).toBe("ok");
    expect(result.device.id).toBe("p1");
    expect(result.serial).toBe("RRRRR001");
  });

  it("ignores whitespace a barcode scanner appends", () => {
    expect(scan("  RRRRR001\n").ok).toBe(true);
  });

  it("matches a serial case-insensitively but returns the pool's spelling", () => {
    const result = scan("rrrrr001");
    expect(result.ok).toBe(true);
    expect(result.serial).toBe("RRRRR001");
  });

  it("rejects an empty scan", () => {
    expect(scan("").code).toBe("empty");
    expect(scan("   ").code).toBe("empty");
    expect(scan(undefined).ok).toBe(false);
  });

  it("rejects a serial already scanned into this transaction", () => {
    const result = scan("RRRRR001", ["RRRRR001"]);
    expect(result.ok).toBe(false);
    expect(result.code).toBe("duplicate");
    expect(result.message).toMatch(/already/i);
  });

  it("rejects a serial that is not in this event's pool", () => {
    const result = scan("ZZZZZ999");
    expect(result.ok).toBe(false);
    expect(result.code).toBe("not_found");
  });

  it("rejects a serial that belongs to a different device type", () => {
    const result = scan("HHHHH001");
    expect(result.ok).toBe(false);
    expect(result.code).toBe("wrong_type");
    // Naming the type it actually is saves a second lookup.
    expect(result.message).toMatch(/headset/i);
  });

  it("rejects a device already out with another consumer", () => {
    const result = scan("RRRRR003");
    expect(result.ok).toBe(false);
    expect(result.code).toBe("in_use");
  });

  it("rejects a written-off device", () => {
    const result = scan("RRRRR004");
    expect(result.ok).toBe(false);
    expect(result.code).toBe("lost");
  });

  it("rejects a scan once the requested quantity is complete", () => {
    const result = describeScan({
      serial: "RRRRR002",
      pool,
      group: "tablet",
      picked: ["RRRRR001"],
      quantity: 1,
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("complete");
  });

  it("allows a scan while the quantity is not yet met", () => {
    const result = describeScan({
      serial: "RRRRR002",
      pool,
      group: "tablet",
      picked: ["RRRRR001"],
      quantity: 2,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects everything when no device type has been chosen", () => {
    const result = describeScan({ serial: "RRRRR001", pool, group: null, picked: [] });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("no_group");
  });

  it("always returns a message a person can read", () => {
    const codes = ["", "ZZZZZ999", "HHHHH001", "RRRRR003", "RRRRR004"];
    codes.forEach((serial) => {
      const result = scan(serial);
      expect(typeof result.message).toBe("string");
      expect(result.message.length).toBeGreaterThan(0);
    });
  });

  it("takes the live pool record when a serial appears more than once", () => {
    // Returning and re-adding a unit leaves several pool rows for one serial;
    // the assignment has to patch the current one.
    const repeated = [
      { id: "old", device: "RRRRR001", type: "tablet", activity: false },
      { id: "new", device: "RRRRR001", type: "tablet", activity: false },
    ];
    const result = describeScan({
      serial: "RRRRR001",
      pool: repeated,
      group: "tablet",
      picked: [],
    });
    expect(result.device.id).toBe("new");
  });

  it("rejects a serial whose any record is in use", () => {
    const repeated = [
      { id: "a", device: "RRRRR001", type: "tablet", activity: false },
      { id: "b", device: "RRRRR001", type: "tablet", activity: true },
    ];
    const result = describeScan({
      serial: "RRRRR001",
      pool: repeated,
      group: "tablet",
      picked: [],
    });
    expect(result.code).toBe("in_use");
  });
});

describe("summarizeSelection", () => {
  it("reports progress toward the requested quantity", () => {
    expect(summarizeSelection({ picked: ["A", "B"], quantity: 3 })).toEqual({
      picked: 2,
      quantity: 3,
      remaining: 1,
      isComplete: false,
      canSubmit: false,
    });
  });

  it("is complete and submittable when the quantity is met", () => {
    expect(summarizeSelection({ picked: ["A", "B"], quantity: 2 })).toEqual({
      picked: 2,
      quantity: 2,
      remaining: 0,
      isComplete: true,
      canSubmit: true,
    });
  });

  it("never reports a negative remaining count", () => {
    expect(summarizeSelection({ picked: ["A", "B", "C"], quantity: 2 }).remaining).toBe(0);
  });

  it("cannot submit an empty selection", () => {
    const summary = summarizeSelection({ picked: [], quantity: 2 });
    expect(summary.canSubmit).toBe(false);
  });

  it("treats a missing quantity as one device", () => {
    expect(summarizeSelection({ picked: ["A"] })).toMatchObject({
      quantity: 1,
      isComplete: true,
      canSubmit: true,
    });
  });

  it("survives a missing selection", () => {
    expect(summarizeSelection({}).picked).toBe(0);
    expect(summarizeSelection({}).canSubmit).toBe(false);
  });
});
