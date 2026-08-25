import { describe, expect, it } from "vitest";
import {
  buildReviewRows,
  buildStockRows,
  describeRangePreview,
  describeScanList,
  describeStepper,
  describeWizardFooter,
  filterStockRows,
} from "./eventStockFlow";

// Shape of /db_event/retrieve-item-group-location-quantity's groupedInventory:
// category -> item group -> location -> available count.
const grouped = () => ({
  Audio: {
    Receiver: { "Washington, DC": 24, "Las Vegas, NV": 12 },
    Transmitter: { "Washington, DC": 8 },
  },
  Video: {
    Camera: { "Las Vegas, NV": 3 },
  },
});

describe("buildStockRows", () => {
  it("flattens the three nested levels into one row per location", () => {
    const rows = buildStockRows(grouped());
    expect(rows).toHaveLength(4);
    expect(rows[0]).toEqual({
      id: "Audio||Receiver||Washington, DC",
      category: "Audio",
      group: "Receiver",
      location: "Washington, DC",
      qty: 24,
    });
  });

  it("keeps the order the response arrives in", () => {
    expect(buildStockRows(grouped()).map((r) => r.group)).toEqual([
      "Receiver",
      "Receiver",
      "Transmitter",
      "Camera",
    ]);
  });

  it("gives every row an id unique across category, group and location", () => {
    const ids = buildStockRows(grouped()).map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("coerces a quantity that arrives as a string", () => {
    const rows = buildStockRows({ Audio: { Receiver: { Warehouse: "7" } } });
    expect(rows[0].qty).toBe(7);
  });

  it("drops locations with no usable count instead of rendering NaN", () => {
    const rows = buildStockRows({
      Audio: { Receiver: { Good: 5, Bad: null, Worse: "abc" } },
    });
    expect(rows.map((r) => r.location)).toEqual(["Good"]);
  });

  it("returns nothing for a missing or non-object response", () => {
    for (const value of [null, undefined, [], "x", 0]) {
      expect(buildStockRows(value)).toEqual([]);
    }
  });
});

describe("filterStockRows", () => {
  const rows = buildStockRows(grouped());

  it("returns everything for an empty query", () => {
    expect(filterStockRows(rows, "")).toHaveLength(4);
    expect(filterStockRows(rows, "   ")).toHaveLength(4);
  });

  // The old Select searched over JSX via optionFilterProp="children", which is
  // why searching barely worked. This matches the three real fields.
  it("matches the group, the category or the location, case-insensitively", () => {
    expect(filterStockRows(rows, "receiver")).toHaveLength(2);
    expect(filterStockRows(rows, "VIDEO")).toHaveLength(1);
    expect(filterStockRows(rows, "vegas")).toHaveLength(2);
  });

  it("matches across fields so a group and a location can be combined", () => {
    expect(filterStockRows(rows, "receiver vegas")).toHaveLength(1);
  });

  it("returns nothing when nothing matches", () => {
    expect(filterStockRows(rows, "zzz")).toEqual([]);
  });

  it("survives a missing list", () => {
    expect(filterStockRows(null, "a")).toEqual([]);
  });
});

describe("describeRangePreview", () => {
  it("waits for both fields before saying anything", () => {
    const p = describeRangePreview({ startSerial: "", requestedQty: 12 });
    expect(p.tone).toBe("idle");
    expect(p.headline).toBe("Fill both fields to see the serials");
    expect(p.countLabel).toBe("—");
    expect(p.serials).toEqual([]);
  });

  it("stays idle for a quantity that is not a positive number", () => {
    for (const qty of ["", "0", "-3", "abc", null]) {
      expect(describeRangePreview({ startSerial: "RX-1", requestedQty: qty }).tone).toBe("idle");
    }
  });

  // The submit resolves the range server-side (inventory.assignableFromSerial),
  // so the preview is that same read, made earlier.
  it("confirms the resolved serials when the server returns the full run", () => {
    const p = describeRangePreview({
      startSerial: "RX-100003",
      requestedQty: 3,
      resolvedSerials: ["RX-100003", "RX-100004", "RX-100005"],
    });
    expect(p.tone).toBe("good");
    expect(p.headline).toBe("These devices will be added");
    expect(p.countLabel).toBe("3 of 3");
    expect(p.note).toBeNull();
    expect(p.serials).toEqual(["RX-100003", "RX-100004", "RX-100005"]);
  });

  it("warns, and says what to do, when fewer are available than asked for", () => {
    const p = describeRangePreview({
      startSerial: "RX-100003",
      requestedQty: 12,
      resolvedSerials: ["RX-100003", "RX-100004"],
    });
    expect(p.tone).toBe("warn");
    expect(p.headline).toBe("Fewer available than asked for");
    expect(p.countLabel).toBe("2 of 12");
    expect(p.note).toBe(
      "Only 2 consecutive devices from RX-100003 onward. Adding will take those; lower the quantity or start further back.",
    );
  });

  it("uses singular wording for a single available device", () => {
    const p = describeRangePreview({
      startSerial: "RX-100003",
      requestedQty: 4,
      resolvedSerials: ["RX-100003"],
    });
    expect(p.note).toBe(
      "Only 1 consecutive device from RX-100003 onward. Adding will take those; lower the quantity or start further back.",
    );
  });

  it("reports a starting serial that is not in this location", () => {
    const p = describeRangePreview({
      startSerial: "00100003",
      requestedQty: 12,
      resolvedSerials: [],
      startExists: false,
    });
    expect(p.tone).toBe("bad");
    expect(p.headline).toBe("That serial is not in this location");
    expect(p.countLabel).toBe("0 found");
    expect(p.note).toBe(
      "It may belong to another location or another item group. Check the serial, or pick different stock.",
    );
    expect(p.serials).toEqual([]);
  });

  it("reports a checking state without claiming a verdict", () => {
    const p = describeRangePreview({
      startSerial: "RX-100003",
      requestedQty: 12,
      checking: true,
    });
    expect(p.tone).toBe("idle");
    expect(p.headline).toBe("Checking this location…");
    expect(p.serials).toEqual([]);
  });

  it("treats a resolved run with an existing start but zero rows as unavailable", () => {
    const p = describeRangePreview({
      startSerial: "RX-100024",
      requestedQty: 5,
      resolvedSerials: [],
      startExists: true,
    });
    expect(p.tone).toBe("bad");
    expect(p.countLabel).toBe("0 found");
  });
});

describe("describeScanList", () => {
  it("says nothing has been scanned yet", () => {
    const s = describeScanList([], []);
    expect(s.summary).toBe("Nothing scanned yet");
    expect(s.rows).toEqual([]);
    expect(s.goodSerials).toEqual([]);
    expect(s.rejectMessage).toBeNull();
  });

  it("marks each scanned serial against what the location actually holds", () => {
    const s = describeScanList(
      ["RX-100001", "RX-999999", "RX-100002"],
      ["RX-100001", "RX-100002"],
    );
    expect(s.rows.map((r) => r.ok)).toEqual([true, false, true]);
    expect(s.summary).toBe("2 of 3 found in this location");
    expect(s.goodSerials).toEqual(["RX-100001", "RX-100002"]);
    expect(s.badSerials).toEqual(["RX-999999"]);
  });

  it("names the rejects and what happens to them", () => {
    const s = describeScanList(["A", "B"], ["A"]);
    expect(s.rejectMessage).toBe(
      "1 serial was not found here and will be skipped: B. Remove it, or add it anyway and only the rest goes in.",
    );
  });

  it("uses plural wording for several rejects", () => {
    const s = describeScanList(["A", "B", "C"], ["A"]);
    expect(s.rejectMessage).toBe(
      "2 serials were not found here and will be skipped: B, C. Remove them, or add them anyway and only the rest goes in.",
    );
  });

  it("reports no rejects when everything matched", () => {
    const s = describeScanList(["A", "B"], ["A", "B"]);
    expect(s.rejectMessage).toBeNull();
    expect(s.summary).toBe("2 of 2 found in this location");
  });

  it("has not validated anything yet when the matched list is unknown", () => {
    const s = describeScanList(["A", "B"], null);
    expect(s.summary).toBe("2 scanned, checking this location…");
    expect(s.rows.every((r) => r.ok === null)).toBe(true);
    expect(s.goodSerials).toEqual([]);
    expect(s.rejectMessage).toBeNull();
  });

  it("compares serials as trimmed strings", () => {
    const s = describeScanList([" A "], ["A"]);
    expect(s.rows[0].ok).toBe(true);
    expect(s.goodSerials).toEqual(["A"]);
  });
});

describe("buildReviewRows", () => {
  const picked = {
    category: "Audio",
    group: "Receiver",
    location: "Washington, DC",
    qty: 24,
  };

  it("spells out exactly what will be written", () => {
    const rows = buildReviewRows({
      picked,
      serials: ["RX-100003", "RX-100004", "RX-100005"],
      deposit: "25.00",
    });
    expect(rows).toEqual([
      { label: "Item group", value: "Audio · Receiver" },
      { label: "Location", value: "Washington, DC" },
      { label: "Devices", value: "3 of 24 available" },
      { label: "Serial range", value: "RX-100003 → RX-100005" },
      { label: "Deposit per device", value: "25.00" },
    ]);
  });

  it("says None when no deposit was entered", () => {
    const rows = buildReviewRows({ picked, serials: ["A"], deposit: "  " });
    expect(rows[4].value).toBe("None");
  });

  it("shows a single serial without an arrow", () => {
    const rows = buildReviewRows({ picked, serials: ["RX-100003"], deposit: "" });
    expect(rows[3].value).toBe("RX-100003");
    expect(rows[2].value).toBe("1 of 24 available");
  });

  it("renders a dash rather than an empty range with no serials", () => {
    const rows = buildReviewRows({ picked, serials: [], deposit: "" });
    expect(rows[3].value).toBe("—");
    expect(rows[2].value).toBe("0 of 24 available");
  });

  it("survives a missing picked row", () => {
    const rows = buildReviewRows({ picked: null, serials: [], deposit: "" });
    expect(rows).toHaveLength(5);
    expect(rows[0].value).toBe("—");
  });
});

describe("describeStepper", () => {
  it("marks the current step and the ones already done", () => {
    const steps = describeStepper("2");
    expect(steps.map((s) => s.state)).toEqual(["done", "current", "upcoming"]);
    expect(steps.map((s) => s.label)).toEqual(["Pick stock", "How many", "Review"]);
    expect(steps[0].badge).toBe("done");
    expect(steps[1].badge).toBe("2");
  });

  it("marks every step done once the flow finishes", () => {
    expect(describeStepper("done").map((s) => s.state)).toEqual(["done", "done", "done"]);
  });

  it("allows navigating back to a completed step only", () => {
    const steps = describeStepper("2");
    expect(steps.map((s) => s.canRevisit)).toEqual([true, false, false]);
  });

  it("treats an unknown step as the first one", () => {
    expect(describeStepper("nope")[0].state).toBe("current");
  });
});

describe("describeWizardFooter", () => {
  it("blocks step one until stock is picked", () => {
    const f = describeWizardFooter({ step: "1", count: 0, hasPicked: false });
    expect(f.nextLabel).toBe("Continue");
    expect(f.nextDisabled).toBe(true);
    expect(f.hint).toBe("Pick the stock you want to add");
    expect(f.showBack).toBe(false);
  });

  it("allows leaving step one once something is picked", () => {
    expect(describeWizardFooter({ step: "1", count: 0, hasPicked: true }).nextDisabled).toBe(false);
  });

  it("counts the devices on the way to review", () => {
    const f = describeWizardFooter({ step: "2", count: 12, hasPicked: true });
    expect(f.nextLabel).toBe("Review 12 devices");
    expect(f.nextDisabled).toBe(false);
    expect(f.showBack).toBe(true);
    expect(f.hint).toBe("Nothing is written until you confirm");
  });

  it("blocks review when nothing resolved", () => {
    expect(describeWizardFooter({ step: "2", count: 0, hasPicked: true }).nextDisabled).toBe(true);
  });

  it("names the write on the confirm step", () => {
    const f = describeWizardFooter({ step: "3", count: 1, hasPicked: true });
    expect(f.nextLabel).toBe("Add 1 device to this event");
    expect(f.hint).toBe("Last chance to change anything");
  });

  it("offers another group once the write landed", () => {
    const f = describeWizardFooter({ step: "done", count: 12, hasPicked: true });
    expect(f.nextLabel).toBe("Done");
    expect(f.showAddAnother).toBe(true);
    expect(f.showBack).toBe(false);
  });

  it("locks the primary action while the write is in flight", () => {
    const f = describeWizardFooter({ step: "3", count: 12, hasPicked: true, submitting: true });
    expect(f.nextDisabled).toBe(true);
    // The three writes are plain inserts with no dedup key, so a second submit
    // adds the same devices again — see commit 95a61580.
    expect(f.hint).toBe("Do not submit again — a second run would add these devices twice.");
  });
});
