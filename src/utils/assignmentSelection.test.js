import { describe, expect, it } from "vitest";
import {
  buildInventoryOptions,
  isAddressComplete,
  remainingUnits,
  resolveSerialScan,
  summarizePick,
} from "./assignmentSelection";

const unit = (serial, itemId = serial) => ({
  serial_number: serial,
  item_id: itemId,
  item_group: "Radio",
  category_name: "Comms",
});

describe("buildInventoryOptions", () => {
  const grouped = {
    Comms: {
      Radio: { "Warehouse B": 2, "Warehouse A": 5 },
      Base: { "Warehouse A": 1 },
    },
    Cases: { Hard: { "Warehouse A": 3 } },
  };

  it("flattens category → item → location into one row per location", () => {
    const options = buildInventoryOptions(grouped);
    expect(options).toHaveLength(4);
    expect(options[0]).toMatchObject({
      category_name: "Cases",
      item_group: "Hard",
      location: "Warehouse A",
      total: 3,
    });
  });

  it("sorts by category, then item, then location, so the list is scannable", () => {
    expect(
      buildInventoryOptions(grouped).map((o) => `${o.item_group}/${o.location}`)
    ).toEqual([
      "Hard/Warehouse A",
      "Base/Warehouse A",
      "Radio/Warehouse A",
      "Radio/Warehouse B",
    ]);
  });

  it("carries every part of the selection back in the value", () => {
    const [first] = buildInventoryOptions({ Comms: { Radio: { "WH A": 2 } } });
    expect(JSON.parse(first.value)).toEqual({
      category_name: "Comms",
      item_group: "Radio",
      location: "WH A",
      quantity: 2,
    });
  });

  it("gives every option a unique key", () => {
    const keys = buildInventoryOptions(grouped).map((o) => o.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("treats a non-numeric quantity as zero and survives a missing tree", () => {
    expect(buildInventoryOptions({ C: { I: { L: "many" } } })[0].total).toBe(0);
    expect(buildInventoryOptions(undefined)).toEqual([]);
  });
});

describe("remainingUnits", () => {
  it("drops what is already picked, matching on the serial", () => {
    const left = remainingUnits([unit("SN-1"), unit("SN-2")], [unit("sn-1")]);
    expect(left.map((u) => u.serial_number)).toEqual(["SN-2"]);
  });

  it("survives missing inputs", () => {
    expect(remainingUnits(undefined, undefined)).toEqual([]);
    expect(remainingUnits([unit("SN-1")], undefined)).toHaveLength(1);
  });
});

describe("resolveSerialScan", () => {
  const available = [unit("SN-1"), unit("SN-2")];

  it("accepts a serial that is available here", () => {
    const result = resolveSerialScan({ serial: "SN-1", available, picked: [] });
    expect(result.ok).toBe(true);
    expect(result.unit.item_id).toBe("SN-1");
  });

  it("returns inventory's spelling, not what was typed", () => {
    expect(resolveSerialScan({ serial: " sn-1 ", available, picked: [] }).serial).toBe(
      "SN-1"
    );
  });

  it("asks for a device before a serial can mean anything", () => {
    expect(resolveSerialScan({ serial: "SN-1", available: [], picked: [] })).toMatchObject(
      { ok: false, code: "no_group" }
    );
  });

  it("names the three failures separately", () => {
    expect(resolveSerialScan({ serial: "  ", available, picked: [] })).toMatchObject({
      code: "empty",
    });
    expect(
      resolveSerialScan({ serial: "SN-1", available, picked: [unit("SN-1")] })
    ).toMatchObject({ code: "duplicate" });
    expect(resolveSerialScan({ serial: "SN-9", available, picked: [] })).toMatchObject({
      code: "not_found",
    });
  });

  it("does not parse a padded serial as a number", () => {
    const padded = [unit("0012")];
    expect(resolveSerialScan({ serial: "0012", available: padded, picked: [] })).toMatchObject(
      { ok: true, serial: "0012" }
    );
  });

  // Only this one exercises behaviour trim() did not already provide: a
  // non-whitespace control character is exactly what a reader glues on when it
  // is programmed with a non-standard terminator.
  it("strips a control character that trim() would keep", () => {
    expect(
      resolveSerialScan({ serial: "\u0002SN-1", available, picked: [] })
    ).toMatchObject({ ok: true, serial: "SN-1" });
  });

  // Regression guards: these already passed before the scan module was wired
  // in, because trim() handles whitespace terminators. They are here so a
  // future change to the normalization cannot quietly break them.
  it("still accepts a CR/LF or tab terminated read", () => {
    expect(
      resolveSerialScan({ serial: "SN-1\r\n", available, picked: [] })
    ).toMatchObject({ ok: true, serial: "SN-1" });
    expect(
      resolveSerialScan({ serial: "SN-1\t", available, picked: [] })
    ).toMatchObject({ ok: true, serial: "SN-1" });
  });

  it("still reports an empty read, not a miss, for a terminator-only value", () => {
    expect(
      resolveSerialScan({ serial: "\r\n", available, picked: [] })
    ).toMatchObject({ ok: false, code: "empty" });
  });

  it("matches a 24-character EPC, which the old length-gated effect could not", () => {
    const epc = [unit("3425E16CA1B2C3D4E5F60718")];
    expect(
      resolveSerialScan({
        serial: "3425E16CA1B2C3D4E5F60718\r",
        available: epc,
        picked: [],
      })
    ).toMatchObject({ ok: true });
  });
});

describe("summarizePick", () => {
  it("counts the pick against what the location holds", () => {
    expect(
      summarizePick({ picked: [unit("SN-1")], available: [unit("SN-1"), unit("SN-2")] })
    ).toEqual({
      picked: 1,
      available: 2,
      remaining: 1,
      isComplete: false,
      canSubmit: true,
    });
  });

  it("refuses to submit an empty assignment", () => {
    // The old form let you submit with a serial that matched nothing; the three
    // nested ifs had no else and it silently did nothing.
    expect(summarizePick({ picked: [], available: [unit("SN-1")] })).toMatchObject({
      canSubmit: false,
    });
  });

  it("survives being handed nothing", () => {
    expect(summarizePick()).toMatchObject({ picked: 0, available: 0, canSubmit: false });
  });
});

describe("isAddressComplete", () => {
  it("needs all four parts", () => {
    expect(
      isAddressComplete({ street: "1 Main", city: "Austin", state: "TX", zip: "78701" })
    ).toBe(true);
    expect(isAddressComplete({ street: "1 Main", city: "Austin", state: "TX" })).toBe(false);
    expect(
      isAddressComplete({ street: " ", city: "Austin", state: "TX", zip: "78701" })
    ).toBe(false);
    expect(isAddressComplete(undefined)).toBe(false);
  });
});
