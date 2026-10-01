import { describe, expect, it } from "vitest";
import { isLostDevice, needsAttention, summarizeEventDevices } from "./eventDeviceSummary";

/**
 * The event's device card splits into two bars (meeting 2026-09-29 `54:19`:
 * "Device condition, condition is the way to say it"). One says where the
 * devices are, the other what state they are in.
 *
 * Shapes are the real `receiversPool` documents: a lost unit is
 * `{ status: "Lost", activity: false }`, the same `activity` as one returned
 * fine, so location cannot be read from `activity` alone.
 */
const unit = (status, activity) => ({ device: "1", status, activity });

describe("summarizeEventDevices — location", () => {
  it("counts a unit out with a consumer as checked out", () => {
    const { location } = summarizeEventDevices([unit("Operational", true)]);
    expect(location).toEqual({ checkedOut: 1, onSite: 0, lostExcluded: 0, total: 1 });
  });

  it("counts a unit returned fine as on site", () => {
    const { location } = summarizeEventDevices([unit("Operational", false)]);
    expect(location.onSite).toBe(1);
  });

  /* It is physically back, even if it cannot be lent again. */
  it("counts a unit returned damaged as on site", () => {
    const { location } = summarizeEventDevices([unit("Damaged", false)]);
    expect(location.onSite).toBe(1);
  });

  /* activity: false, like a returned one — but it is not in the building. */
  it("leaves a lost unit out of the location bar, and says how many", () => {
    const { location } = summarizeEventDevices([
      unit("Lost", false),
      unit("Operational", false),
    ]);
    expect(location).toEqual({ checkedOut: 0, onSite: 1, lostExcluded: 1, total: 1 });
  });
});

describe("summarizeEventDevices — condition", () => {
  it("splits every unit into operational, needs repair and lost", () => {
    const { condition } = summarizeEventDevices([
      unit("Operational", true),
      unit("Operational", false),
      unit("Damaged", false),
      unit("Lost", false),
    ]);
    expect(condition).toEqual({ operational: 2, needsRepair: 1, lost: 1, total: 4 });
  });

  it("reads the status case-insensitively", () => {
    const { condition } = summarizeEventDevices([unit("lost", false), unit("operational", true)]);
    expect(condition).toMatchObject({ operational: 1, lost: 1, needsRepair: 0 });
  });
});

describe("summarizeEventDevices — input", () => {
  it("is all zeros for an empty or missing pool", () => {
    const empty = {
      location: { checkedOut: 0, onSite: 0, lostExcluded: 0, total: 0 },
      condition: { operational: 0, needsRepair: 0, lost: 0, total: 0 },
    };
    expect(summarizeEventDevices([])).toEqual(empty);
    expect(summarizeEventDevices(undefined)).toEqual(empty);
  });
});

describe("needsAttention", () => {
  it("is every unit that is not operational, lost included", () => {
    const pool = [unit("Operational", false), unit("Damaged", false), unit("Lost", false)];
    expect(pool.filter(needsAttention).map((u) => u.status)).toEqual(["Damaged", "Lost"]);
  });
});

describe("isLostDevice", () => {
  it("matches Lost in any case", () => {
    expect(isLostDevice(unit("LOST", false))).toBe(true);
    expect(isLostDevice(unit("Operational", false))).toBe(false);
  });
});
