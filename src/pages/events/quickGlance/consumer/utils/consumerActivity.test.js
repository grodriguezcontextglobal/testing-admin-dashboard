import { describe, expect, it } from "vitest";
import {
  buildConsumerChips,
  buildConsumerStatTiles,
  countRequestedDevices,
  describeDeviceState,
  summarizeConsumerDevices,
} from "./consumerActivity";

const receiver = (status, deviceValue = 0, serialNumber = "SN") => ({
  paymentIntent: "pi_1",
  device: { serialNumber, deviceType: "tablet", status, deviceValue },
});

describe("describeDeviceState", () => {
  it("reads a boolean true as still out with the consumer", () => {
    expect(describeDeviceState(true)).toEqual({
      key: "out",
      tone: "neutral",
      label: "In use",
    });
  });

  it("reads a boolean false as returned", () => {
    expect(describeDeviceState(false)).toEqual({
      key: "returned",
      tone: "success",
      label: "Returned",
    });
  });

  it("reads any casing of the lost sentinel as lost", () => {
    expect(describeDeviceState("Lost").key).toBe("lost");
    expect(describeDeviceState("lost").key).toBe("lost");
    expect(describeDeviceState("LOST").tone).toBe("critical");
  });

  it("passes an unrecognised string through as its own label", () => {
    expect(describeDeviceState("Damaged")).toEqual({
      key: "other",
      tone: "neutral",
      label: "Damaged",
    });
  });

  it("treats a missing status as returned rather than as out", () => {
    // Matches the legacy renderer: only an explicit `true` meant "in use", so a
    // record with no status must not be counted against the consumer.
    expect(describeDeviceState(undefined).key).toBe("returned");
    expect(describeDeviceState(null).key).toBe("returned");
  });
});

describe("summarizeConsumerDevices", () => {
  it("returns an all-zero summary for no receivers", () => {
    expect(summarizeConsumerDevices([])).toEqual({
      total: 0,
      out: 0,
      returned: 0,
      lost: 0,
      valueOnLoan: 0,
    });
  });

  it("survives a missing or malformed payload", () => {
    expect(summarizeConsumerDevices(undefined).total).toBe(0);
    expect(summarizeConsumerDevices(null).total).toBe(0);
    expect(summarizeConsumerDevices([{}, { device: null }]).total).toBe(2);
  });

  it("splits receivers across out, returned and lost", () => {
    const summary = summarizeConsumerDevices([
      receiver(true, 250, "A"),
      receiver(true, 250, "B"),
      receiver(false, 250, "C"),
      receiver("Lost", 250, "D"),
    ]);

    expect(summary).toEqual({
      total: 4,
      out: 2,
      returned: 1,
      lost: 1,
      valueOnLoan: 500,
    });
  });

  it("counts only devices still out toward the value on loan", () => {
    const summary = summarizeConsumerDevices([
      receiver(true, 100, "A"),
      receiver(false, 999, "B"),
      receiver("Lost", 999, "C"),
    ]);

    expect(summary.valueOnLoan).toBe(100);
  });

  it("does not count a lost device as returned", () => {
    // The legacy count used `!data.device.status`, and "Lost" is truthy, so a
    // lost device fell out of both buckets. It is its own bucket now.
    const summary = summarizeConsumerDevices([receiver("Lost", 0, "A")]);
    expect(summary.returned).toBe(0);
    expect(summary.lost).toBe(1);
  });

  it("coerces a non-numeric device value to zero", () => {
    const summary = summarizeConsumerDevices([
      receiver(true, "not-a-number", "A"),
      receiver(true, "150", "B"),
    ]);
    expect(summary.valueOnLoan).toBe(150);
  });
});

describe("countRequestedDevices", () => {
  it("sums what each transaction asked for", () => {
    const transactions = [
      { device: [{ deviceNeeded: 2 }] },
      { device: [{ deviceNeeded: 3 }] },
    ];
    expect(countRequestedDevices(transactions)).toBe(5);
  });

  it("accepts string quantities from the API", () => {
    expect(countRequestedDevices([{ device: [{ deviceNeeded: "4" }] }])).toBe(4);
  });

  it("skips transactions with no device block instead of throwing", () => {
    expect(
      countRequestedDevices([{}, { device: [] }, { device: [{ deviceNeeded: 1 }] }])
    ).toBe(1);
  });

  it("returns zero for a missing list", () => {
    expect(countRequestedDevices(undefined)).toBe(0);
  });
});

describe("buildConsumerStatTiles", () => {
  const summary = { total: 6, out: 3, returned: 2, lost: 1, valueOnLoan: 750 };

  it("shows requested, out, returned and lost", () => {
    const tiles = buildConsumerStatTiles({ requested: 6, summary });
    expect(tiles.map((tile) => tile.label)).toEqual([
      "Requested",
      "Devices out",
      "Returned",
      "Lost",
    ]);
    expect(tiles.map((tile) => tile.value)).toEqual([6, 3, 2, 1]);
  });

  it("marks lost as the single critical tile when something is lost", () => {
    const tiles = buildConsumerStatTiles({ requested: 6, summary });
    const critical = tiles.filter((tile) => tile.tone === "critical");
    expect(critical).toHaveLength(1);
    expect(critical[0].label).toBe("Lost");
  });

  it("keeps every tile neutral when nothing is lost", () => {
    const tiles = buildConsumerStatTiles({
      requested: 2,
      summary: { total: 2, out: 0, returned: 2, lost: 0, valueOnLoan: 0 },
    });
    expect(tiles.every((tile) => tile.tone !== "critical")).toBe(true);
  });

  it("prices the outstanding kit on the devices-out tile", () => {
    const tiles = buildConsumerStatTiles({ requested: 6, summary });
    const out = tiles.find((tile) => tile.label === "Devices out");
    expect(out.sub).toBe("$750 on loan");
  });

  it("says nothing is pending when every device came back", () => {
    const tiles = buildConsumerStatTiles({
      requested: 2,
      summary: { total: 2, out: 0, returned: 2, lost: 0, valueOnLoan: 0 },
    });
    const out = tiles.find((tile) => tile.label === "Devices out");
    expect(out.sub).toBe("Nothing pending");
  });

  it("flags an under-assigned consumer on the requested tile", () => {
    const tiles = buildConsumerStatTiles({
      requested: 6,
      summary: { total: 4, out: 4, returned: 0, lost: 0, valueOnLoan: 0 },
    });
    const requested = tiles.find((tile) => tile.label === "Requested");
    expect(requested.sub).toBe("2 still to assign");
  });

  it("reports a fully assigned consumer as complete", () => {
    const tiles = buildConsumerStatTiles({
      requested: 4,
      summary: { total: 4, out: 4, returned: 0, lost: 0, valueOnLoan: 0 },
    });
    const requested = tiles.find((tile) => tile.label === "Requested");
    expect(requested.sub).toBe("All assigned");
  });
});

describe("buildConsumerChips", () => {
  it("leads with lost when there is a lost device", () => {
    const chips = buildConsumerChips({
      total: 4,
      out: 2,
      returned: 1,
      lost: 1,
      valueOnLoan: 0,
    });
    expect(chips[0]).toEqual({
      key: "lost",
      tone: "critical",
      pip: true,
      label: "1 lost",
    });
  });

  it("counts devices out rather than describing a mood", () => {
    const chips = buildConsumerChips({
      total: 3,
      out: 3,
      returned: 0,
      lost: 0,
      valueOnLoan: 0,
    });
    expect(chips.find((chip) => chip.key === "out").label).toBe("3 devices out");
  });

  it("uses the singular for one device out", () => {
    const chips = buildConsumerChips({
      total: 1,
      out: 1,
      returned: 0,
      lost: 0,
      valueOnLoan: 0,
    });
    expect(chips.find((chip) => chip.key === "out").label).toBe("1 device out");
  });

  it("says the consumer is clear when nothing is out", () => {
    const chips = buildConsumerChips({
      total: 2,
      out: 0,
      returned: 2,
      lost: 0,
      valueOnLoan: 0,
    });
    const out = chips.find((chip) => chip.key === "out");
    expect(out.label).toBe("No devices out");
    expect(out.tone).toBe("neutral");
  });

  it("emits no lost chip when nothing is lost", () => {
    const chips = buildConsumerChips({
      total: 2,
      out: 2,
      returned: 0,
      lost: 0,
      valueOnLoan: 0,
    });
    expect(chips.some((chip) => chip.key === "lost")).toBe(false);
  });
});
