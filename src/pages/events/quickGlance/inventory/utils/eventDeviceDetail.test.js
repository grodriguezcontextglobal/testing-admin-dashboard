import { describe, expect, it } from "vitest";
import {
  buildDeviceStatTiles,
  describeDeviceCondition,
  filterDeviceRows,
  readDeviceSelection,
  toAssignmentRows,
  toIssueRows,
} from "./eventDeviceDetail";

describe("readDeviceSelection", () => {
  // The three screens that navigate here each build a different shape.
  const fromDeviceDatabase = {
    company: ["tablet", "Context Global"],
    activity: true,
    status: "Operational",
    serialNumber: "RRRRR001",
    entireData: {
      device: "RRRRR001",
      type: "tablet",
      provider: "Context Global",
      status: "Operational",
      activity: true,
    },
  };

  const fromSearchBar = {
    company: ["tablet", "Expo 2026"],
    activity: false,
    status: "Operational",
    serialNumber: "RRRRR002",
    // SearchDevice spreads an unrelated payload in here; it carries neither
    // `device` nor `type`, which is why the old header rendered
    // "undefined undefined".
    entireData: { some: "other shape" },
  };

  it("reads the shape the event inventory table dispatches", () => {
    expect(readDeviceSelection(fromDeviceDatabase)).toMatchObject({
      hasData: true,
      serialNumber: "RRRRR001",
      type: "tablet",
      provider: "Context Global",
      status: "Operational",
      isAssigned: true,
      isLost: false,
    });
  });

  it("falls back to the top-level fields when entireData is a different shape", () => {
    const selection = readDeviceSelection(fromSearchBar);
    expect(selection.serialNumber).toBe("RRRRR002");
    expect(selection.type).toBe("tablet");
    expect(selection.provider).toBe("Expo 2026");
    expect(selection.isAssigned).toBe(false);
  });

  it("reports no data rather than throwing on an empty selection", () => {
    // Reloading /device-quick-glance, or landing after the selection is reset,
    // used to read `deviceInfoSelected.entireData.type` and take the page down.
    expect(readDeviceSelection({})).toMatchObject({ hasData: false });
    expect(readDeviceSelection(undefined).hasData).toBe(false);
    expect(readDeviceSelection(null).serialNumber).toBeNull();
  });

  it("reads the LOST sentinel the inventory table writes into activity", () => {
    const lost = readDeviceSelection({
      ...fromDeviceDatabase,
      activity: "LOST",
      status: "Lost",
    });
    expect(lost.isLost).toBe(true);
    expect(lost.isAssigned).toBe(false);
  });

  it("treats a lost status as lost even when activity still says in use", () => {
    const lost = readDeviceSelection({
      ...fromDeviceDatabase,
      activity: true,
      status: "Lost",
    });
    expect(lost.isLost).toBe(true);
    expect(lost.isAssigned).toBe(false);
  });

  it("survives a selection with no company tuple", () => {
    const selection = readDeviceSelection({ serialNumber: "X1" });
    expect(selection.serialNumber).toBe("X1");
    expect(selection.type).toBeNull();
    expect(selection.hasData).toBe(true);
  });
});

describe("describeDeviceCondition", () => {
  it("reports a device out with a consumer", () => {
    const state = describeDeviceCondition({ isAssigned: true, isLost: false });
    expect(state).toMatchObject({ key: "in_use", tone: "action", label: "In use" });
  });

  it("reports an available device", () => {
    expect(describeDeviceCondition({ isAssigned: false, isLost: false })).toMatchObject({
      key: "available",
      tone: "success",
      label: "Available",
    });
  });

  it("reports a lost device as critical", () => {
    expect(describeDeviceCondition({ isLost: true })).toMatchObject({
      key: "lost",
      tone: "critical",
      label: "Lost",
    });
  });

  it("surfaces a non-operational condition as a warning", () => {
    expect(
      describeDeviceCondition({ isAssigned: false, isLost: false, status: "Damaged" })
    ).toMatchObject({ key: "issue", tone: "warning", label: "Damaged" });
  });

  it("does not treat Operational as a condition worth flagging", () => {
    expect(
      describeDeviceCondition({ isAssigned: false, status: "Operational" }).key
    ).toBe("available");
  });

  it("always returns a label", () => {
    [{}, { isLost: true }, { isAssigned: true }, { status: "" }].forEach((input) => {
      expect(describeDeviceCondition(input).label).toBeTruthy();
    });
  });
});

describe("toAssignmentRows", () => {
  const receivers = [
    {
      id: "r1",
      user: "ana@x.com",
      paymentIntent: "pi_1",
      eventSelected: ["Expo 2026"],
      device: { serialNumber: "RRRRR001", deviceType: "tablet", status: true },
    },
    {
      id: "r2",
      user: "luis@x.com",
      paymentIntent: "pi_2",
      eventSelected: ["Expo 2026"],
      device: { serialNumber: "RRRRR001", deviceType: "tablet", status: false },
    },
  ];

  it("maps receivers to rows, newest first", () => {
    const rows = toAssignmentRows(receivers);
    expect(rows.map((row) => row.key)).toEqual(["r2", "r1"]);
  });

  it("reads the event name out of the array the API sends", () => {
    expect(toAssignmentRows(receivers)[0].eventName).toBe("Expo 2026");
  });

  it("reads a plain-string event name too", () => {
    const rows = toAssignmentRows([{ id: "r1", eventSelected: "Expo 2026" }]);
    expect(rows[0].eventName).toBe("Expo 2026");
  });

  it("describes the device state per row", () => {
    const rows = toAssignmentRows(receivers);
    expect(rows.find((row) => row.key === "r1").state.label).toBe("In use");
    expect(rows.find((row) => row.key === "r2").state.label).toBe("Returned");
  });

  it("survives a receiver with no device block", () => {
    const rows = toAssignmentRows([{ id: "r1", user: "a@b.com" }]);
    expect(rows).toHaveLength(1);
    expect(rows[0].state.label).toBe("Returned");
  });

  it("survives a missing list", () => {
    expect(toAssignmentRows(undefined)).toEqual([]);
    expect(toAssignmentRows(null)).toEqual([]);
  });
});

describe("toIssueRows", () => {
  // Returned-issue records are POOL records: `device` is the serial STRING,
  // not a device object. Merging them into the assignment table is what made a
  // lost device render as "Returned" — `record.device.status` on a string is
  // undefined, which the old ternary read as "returned".
  const records = [
    {
      id: "i1",
      device: "RRRRR001",
      type: "tablet",
      status: "Lost",
      comment: "Device lost",
      user: "ana@x.com",
      admin: "admin@x.com",
      eventSelected: "Expo 2026",
      timeStamp: 1770000000000,
    },
  ];

  it("maps a pool record without reaching into device as an object", () => {
    const rows = toIssueRows(records);
    expect(rows[0]).toMatchObject({
      key: "i1",
      serialNumber: "RRRRR001",
      condition: "Lost",
      comment: "Device lost",
      user: "ana@x.com",
      admin: "admin@x.com",
      eventName: "Expo 2026",
    });
  });

  it("keeps the reported condition rather than inferring a status", () => {
    expect(toIssueRows([{ id: "i", device: "X", status: "Damaged" }])[0].condition).toBe(
      "Damaged"
    );
  });

  it("falls back to a readable condition when none was recorded", () => {
    expect(toIssueRows([{ id: "i", device: "X" }])[0].condition).toBe("Reported");
  });

  it("carries the timestamp through for sorting and display", () => {
    expect(toIssueRows(records)[0].reportedAt).toBe(1770000000000);
  });

  it("survives a missing list", () => {
    expect(toIssueRows(undefined)).toEqual([]);
  });
});

describe("filterDeviceRows", () => {
  const rows = [
    { user: "ana@x.com", eventName: "Expo 2026", serialNumber: "RRRRR001" },
    { user: "luis@x.com", eventName: "Trade Show", serialNumber: "RRRRR002" },
  ];

  it("returns everything for an empty term", () => {
    expect(filterDeviceRows(rows, "")).toHaveLength(2);
    expect(filterDeviceRows(rows, undefined)).toHaveLength(2);
  });

  it("matches on consumer email", () => {
    expect(filterDeviceRows(rows, "ana@")).toHaveLength(1);
  });

  it("matches on event name", () => {
    // The old filter read `element.eventSelected[0]`, which on a plain-string
    // event name is its first character — so searching an event name never
    // matched the issue rows.
    expect(filterDeviceRows(rows, "trade")).toHaveLength(1);
  });

  it("ignores case and padding", () => {
    expect(filterDeviceRows(rows, "  EXPO ")).toHaveLength(1);
  });

  it("returns nothing for a term present in neither", () => {
    expect(filterDeviceRows(rows, "nobody")).toHaveLength(0);
  });

  it("survives a missing list and rows with missing fields", () => {
    expect(filterDeviceRows(undefined, "a")).toEqual([]);
    expect(filterDeviceRows([{}], "a")).toEqual([]);
  });
});

describe("buildDeviceStatTiles", () => {
  const assignments = [
    { user: "ana@x.com", state: { key: "out" } },
    { user: "luis@x.com", state: { key: "returned" } },
    { user: "ana@x.com", state: { key: "returned" } },
  ];

  it("counts assignments and the distinct consumers behind them", () => {
    const tiles = buildDeviceStatTiles({
      assignments,
      issues: [],
      condition: { label: "Available", key: "available" },
    });
    const byLabel = Object.fromEntries(tiles.map((tile) => [tile.label, tile]));
    expect(byLabel["Times assigned"].value).toBe(3);
    expect(byLabel["Consumers"].value).toBe(2);
  });

  it("shows the current condition as its own tile", () => {
    const tiles = buildDeviceStatTiles({
      assignments,
      issues: [],
      condition: { label: "In use", key: "in_use" },
    });
    expect(tiles.find((tile) => tile.label === "Right now").value).toBe("In use");
  });

  it("marks issues critical only when there are any", () => {
    const clean = buildDeviceStatTiles({
      assignments,
      issues: [],
      condition: { label: "Available", key: "available" },
    });
    expect(clean.find((tile) => tile.label === "Issues").tone).not.toBe("critical");

    // Condition deliberately not "lost" here: a lost device is itself the
    // critical tile, and the next test pins that only one tile may carry it.
    const dirty = buildDeviceStatTiles({
      assignments,
      issues: [{ condition: "Damaged" }],
      condition: { label: "Available", key: "available" },
    });
    expect(dirty.find((tile) => tile.label === "Issues").tone).toBe("critical");
  });

  it("stands the issues tile down when the device itself is lost", () => {
    const tiles = buildDeviceStatTiles({
      assignments,
      issues: [{ condition: "Lost" }],
      condition: { label: "Lost", key: "lost" },
    });
    expect(tiles.find((tile) => tile.label === "Right now").tone).toBe("critical");
    expect(tiles.find((tile) => tile.label === "Issues").tone).not.toBe("critical");
  });

  it("never marks more than one tile critical", () => {
    const tiles = buildDeviceStatTiles({
      assignments,
      issues: [{ condition: "Lost" }, { condition: "Damaged" }],
      condition: { label: "Lost", key: "lost" },
    });
    expect(tiles.filter((tile) => tile.tone === "critical")).toHaveLength(1);
  });

  it("reads a never-assigned device as such", () => {
    const tiles = buildDeviceStatTiles({
      assignments: [],
      issues: [],
      condition: { label: "Available", key: "available" },
    });
    expect(tiles.find((tile) => tile.label === "Times assigned").sub).toMatch(
      /never/i
    );
  });

  it("survives missing inputs", () => {
    const tiles = buildDeviceStatTiles({});
    expect(tiles).toHaveLength(4);
    expect(tiles.every((tile) => tile.label)).toBe(true);
  });
});
