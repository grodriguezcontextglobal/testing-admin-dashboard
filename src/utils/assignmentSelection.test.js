import { describe, expect, it } from "vitest";
import {
  buildInventoryOptions,
  isAddressComplete,
  isAddressUsable,
  findOptionForDevice,
  formatLeaseLocation,
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

/**
 * The address stopped being mandatory after the product review. The reasoning
 * was data minimisation, in his words: most answers are the school's own
 * address, and for a device going home with a child it is a family's home
 * address — "do you really need to have that in this database? Probably not."
 *
 * Optional is not the same as unchecked. A half-typed address is worse than no
 * address, because it looks like a record and cannot be delivered to, and the
 * old gate accepted a single letter in every field.
 */
describe("isAddressUsable", () => {
  const full = { street: "1 Main", city: "Austin", state: "TX", zip: "78701" };

  it("accepts a completely empty address — answering is voluntary", () => {
    expect(isAddressUsable({ street: "", city: "", state: "", zip: "" })).toBe(true);
    expect(isAddressUsable({})).toBe(true);
    expect(isAddressUsable(undefined)).toBe(true);
  });

  it("accepts whitespace as empty, not as an answer", () => {
    expect(
      isAddressUsable({ street: "  ", city: " ", state: "", zip: "   " })
    ).toBe(true);
  });

  it("accepts a complete address", () => {
    expect(isAddressUsable(full)).toBe(true);
  });

  it("rejects a half-typed one — that is a slip, not a choice", () => {
    expect(isAddressUsable({ ...full, city: "" })).toBe(false);
    expect(isAddressUsable({ street: "1 Main", city: "", state: "", zip: "" })).toBe(
      false
    );
  });

  it("rejects a zip with no digit in it", () => {
    // He typed F into the zip, the state and the city, and the form took it.
    expect(isAddressUsable({ ...full, zip: "F" })).toBe(false);
  });
});

describe("findOptionForDevice", () => {
  const options = [
    { key: "Laptops|Chromebook|IT office", category_name: "Laptops", item_group: "Chromebook", location: "IT office" },
    { key: "Laptops|Chromebook|Main office", category_name: "Laptops", item_group: "Chromebook", location: "Main office" },
    { key: "Tablets|iPad|IT office", category_name: "Tablets", item_group: "iPad", location: "IT office" },
  ];

  it("finds the group holding a device, location included", () => {
    expect(
      findOptionForDevice(options, {
        category_name: "Laptops",
        item_group: "Chromebook",
        location: "Main office",
      })?.key
    ).toBe("Laptops|Chromebook|Main office");
  });

  it("falls back to category and group when the location is unknown, if that is unambiguous", () => {
    expect(
      findOptionForDevice(options, {
        category_name: "Tablets",
        item_group: "iPad",
      })?.key
    ).toBe("Tablets|iPad|IT office");
  });

  it("refuses to guess when the location is unknown and several groups match", () => {
    expect(
      findOptionForDevice(options, {
        category_name: "Laptops",
        item_group: "Chromebook",
      })
    ).toBeNull();
  });

  it("is null for a device no group holds, or no device at all", () => {
    expect(
      findOptionForDevice(options, { category_name: "Phones", item_group: "Pixel" })
    ).toBeNull();
    expect(findOptionForDevice(options, null)).toBeNull();
    expect(findOptionForDevice(null, { category_name: "Laptops" })).toBeNull();
  });
});

/**
 * Regression from making the address optional (B6): the lease payload still
 * built its location by interpolating the four fields into one template, so a
 * blank address produced "   " — three spaces — and
 * POST /db_lease/new-lease answered
 * `{ ok: false, msg: "Missing required fields: location" }`.
 *
 * Optional in the form does not mean absent on the wire. The server needs
 * somewhere the device is recorded as kept, and when nobody typed one there are
 * two better answers than whitespace: the shelf it came off, and the company's
 * own address — which is the answer Fredrik predicted people would give anyway
 * ("most of these answers are going to be the school address").
 */
describe("formatLeaseLocation", () => {
  const typed = { street: "1 Main", city: "Austin", state: "TX", zip: "78701" };
  const company = {
    street: "500 Bridges Rd",
    city: "Washington",
    state: "DC",
    postal_code: "20001",
  };

  it("uses the typed address when there is one", () => {
    expect(
      formatLeaseLocation({ address: typed, deviceLocation: "IT office" })
    ).toBe("1 Main Austin TX 78701");
  });

  it("never returns whitespace for a blank address", () => {
    expect(formatLeaseLocation({ address: { street: "", city: "", state: "", zip: "" } }))
      .toBe("");
    expect(formatLeaseLocation({})).toBe("");
  });

  it("falls back to where the device is kept", () => {
    expect(
      formatLeaseLocation({ address: {}, deviceLocation: "IT office" })
    ).toBe("IT office");
  });

  it("falls back to the company address when the device has no location", () => {
    expect(
      formatLeaseLocation({ address: {}, deviceLocation: "  ", companyAddress: company })
    ).toBe("500 Bridges Rd Washington DC 20001");
  });

  it("reads either spelling of the company's postcode", () => {
    expect(
      formatLeaseLocation({ companyAddress: { city: "Austin", zip: "78701" } })
    ).toBe("Austin 78701");
  });

  it("drops the gaps a missing field would leave", () => {
    // The bug in one line: a template leaves the spaces behind, a join does not.
    expect(
      formatLeaseLocation({ address: { street: "1 Main", city: "", state: "TX", zip: "" } })
    ).toBe("1 Main TX");
  });
});
