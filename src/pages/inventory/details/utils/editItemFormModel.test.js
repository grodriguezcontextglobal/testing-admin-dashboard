import { describe, expect, it } from "vitest";
import {
  EDITABLE_STOCK_STATES,
  buildEditItemFormValues,
  isItemInStock,
  resolveStockFields,
  buildExtraSerialNumberPayload,
  parseExtraInfoEntries,
  parseReturnDate,
  parseSubLocations,
  resolveSupplierId,
  resolveSupplierName,
} from "./editItemFormModel";

const item = {
  item_id: 91,
  serial_number: "SN-1001",
  category_name: "Audio",
  item_group: "PL6 RF Receiver",
  brand: "Congress Audio",
  cost: "99.00",
  descript_item: "Receiver",
  ownership: "Rent",
  main_warehouse: "Miami, FL",
  location: "Orlando, FL",
  sub_location: JSON.stringify(["Section B", "Locker B203"]),
  container: 0,
  containerSpotLimit: null,
  enableAssignFeature: 1,
  supplier_info: 77,
  return_date: "2026-05-10 15:30:00",
  extra_serial_number: JSON.stringify([
    { "SN-1001": [{ keyObject: "MAC", valueObject: "00:1B:44" }] },
  ]),
};

const dicSuppliers = [
  ["Rental Equipment LLC", 77],
  ["TechCorp", 12],
];

describe("buildEditItemFormValues", () => {
  it("fills Taxable location from main_warehouse", () => {
    // The field is named tax_location and the column is main_warehouse. Seeding
    // by column name left it blank, and the submit handler rejects a blank
    // tax_location — so editing anything failed with "All fields are required".
    expect(buildEditItemFormValues(item).tax_location).toBe("Miami, FL");
  });

  it("fills Supplier from the resolved supplier name", () => {
    expect(
      buildEditItemFormValues(item, { supplierName: "Rental Equipment LLC" })
        .supplier,
    ).toBe("Rental Equipment LLC");
  });

  it("leaves Supplier blank when the item has none", () => {
    expect(
      buildEditItemFormValues({ ...item, supplier_info: null }).supplier,
    ).toBe("");
  });

  it("keeps the raw columns the form also renders", () => {
    const values = buildEditItemFormValues(item);
    expect(values.category_name).toBe("Audio");
    expect(values.item_group).toBe("PL6 RF Receiver");
    expect(values.location).toBe("Orlando, FL");
  });

  it("maps enableAssignFeature to the YES/NO the dropdown uses", () => {
    expect(buildEditItemFormValues(item).enableAssignFeature).toBe("YES");
    expect(
      buildEditItemFormValues({ ...item, enableAssignFeature: 0 })
        .enableAssignFeature,
    ).toBe("NO");
  });

  it("maps container to the sentence the dropdown uses", () => {
    expect(buildEditItemFormValues(item).container).toBe(
      "No - It is not a container",
    );
    expect(buildEditItemFormValues({ ...item, container: 1 }).container).toBe(
      "Yes - It is a container",
    );
  });

  it("tolerates boolean and string spellings of the flags", () => {
    expect(
      buildEditItemFormValues({ ...item, container: true }).container,
    ).toBe("Yes - It is a container");
    expect(
      buildEditItemFormValues({ ...item, enableAssignFeature: "1" })
        .enableAssignFeature,
    ).toBe("YES");
  });

  it("clears the sub-location input — submitted ones render as chips instead", () => {
    expect(buildEditItemFormValues(item).sub_location).toBe("");
  });

  it("never seeds a quantity", () => {
    expect(buildEditItemFormValues(item).quantity).toBe(0);
  });
});

describe("parseSubLocations", () => {
  it("parses a JSON-encoded array", () => {
    expect(parseSubLocations(JSON.stringify(["A", "B"]))).toEqual(["A", "B"]);
  });

  it("accepts an array as-is", () => {
    expect(parseSubLocations(["A"])).toEqual(["A"]);
  });

  it("returns an empty list for null, empty string and malformed JSON", () => {
    expect(parseSubLocations(null)).toEqual([]);
    expect(parseSubLocations("")).toEqual([]);
    expect(parseSubLocations("[")).toEqual([]);
    expect(parseSubLocations("[]")).toEqual([]);
  });
});

describe("parseReturnDate", () => {
  it("parses the 'YYYY-MM-DD HH:mm:ss' shape the API stores", () => {
    const parsed = parseReturnDate("2026-05-10 15:30:00");
    expect(parsed).toBeInstanceOf(Date);
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(4);
    expect(parsed.getDate()).toBe(10);
    expect(parsed.getHours()).toBe(15);
  });

  it("returns null for empty, null and unparseable values", () => {
    expect(parseReturnDate(null)).toBeNull();
    expect(parseReturnDate("")).toBeNull();
    expect(parseReturnDate("not a date")).toBeNull();
  });
});

describe("parseExtraInfoEntries", () => {
  it("reads the entries stored under this item's serial number", () => {
    expect(parseExtraInfoEntries(item)).toEqual([
      { keyObject: "MAC", valueObject: "00:1B:44" },
    ]);
  });

  it("reads a flat entry list too", () => {
    expect(
      parseExtraInfoEntries({
        serial_number: "SN-1",
        extra_serial_number: JSON.stringify([
          { keyObject: "Color", valueObject: "Black" },
        ]),
      }),
    ).toEqual([{ keyObject: "Color", valueObject: "Black" }]);
  });

  it("drops the internal item_id entry", () => {
    expect(
      parseExtraInfoEntries({
        serial_number: "SN-1",
        extra_serial_number: JSON.stringify([
          { keyObject: "item_id", valueObject: "91" },
          { keyObject: "Color", valueObject: "Black" },
        ]),
      }),
    ).toEqual([{ keyObject: "Color", valueObject: "Black" }]);
  });

  it("returns an empty list rather than throwing on malformed JSON", () => {
    expect(
      parseExtraInfoEntries({ serial_number: "SN-1", extra_serial_number: "{" }),
    ).toEqual([]);
    expect(parseExtraInfoEntries({})).toEqual([]);
  });
});

describe("buildExtraSerialNumberPayload", () => {
  it("wraps entries under the serial number, as the API stores them", () => {
    expect(
      JSON.parse(
        buildExtraSerialNumberPayload({
          serialNumber: "SN-1001",
          entries: [{ keyObject: "MAC", valueObject: "00:1B:44" }],
        }),
      ),
    ).toEqual([{ "SN-1001": [{ keyObject: "MAC", valueObject: "00:1B:44" }] }]);
  });

  it("sends an empty array only when there is genuinely nothing to keep", () => {
    expect(
      buildExtraSerialNumberPayload({ serialNumber: "SN-1001", entries: [] }),
    ).toBe("[]");
  });
});

describe("resolveSupplierName / resolveSupplierId", () => {
  it("maps a stored supplier id back to its name", () => {
    expect(resolveSupplierName(dicSuppliers, 77)).toBe("Rental Equipment LLC");
  });

  it("compares ids loosely, since the column may come back as a string", () => {
    expect(resolveSupplierName(dicSuppliers, "77")).toBe(
      "Rental Equipment LLC",
    );
  });

  it("returns an empty name for an unknown or missing id", () => {
    expect(resolveSupplierName(dicSuppliers, 999)).toBe("");
    expect(resolveSupplierName(dicSuppliers, null)).toBe("");
    expect(resolveSupplierName(undefined, 77)).toBe("");
  });

  it("maps a name back to its id", () => {
    expect(resolveSupplierId(dicSuppliers, "TechCorp")).toBe(12);
  });

  it("returns null for a name that is not a known supplier, instead of throwing", () => {
    // `.find(...)[1]` used to throw here, which surfaced as a failed save with
    // an unrelated message whenever someone typed a supplier by hand.
    expect(resolveSupplierId(dicSuppliers, "Typed By Hand")).toBeNull();
    expect(resolveSupplierId(dicSuppliers, "")).toBeNull();
    expect(resolveSupplierId(undefined, "TechCorp")).toBeNull();
  });
});

/**
 * Editing an item used to send `warehouse: true` no matter what the item was,
 * so saving a description change on a device that was out with a member put it
 * back on the shelf — in the item table, while the lease still said somebody
 * held it. The two records then disagreed and only a human could tell which
 * was right.
 *
 * Where a unit is, is not this form's fact to state when the unit is out: that
 * is the lease's, and it is written by the assignment and return flows.
 */
describe("isItemInStock", () => {
  it("reads the flag however the endpoint serialised it", () => {
    expect(isItemInStock({ warehouse: 1 })).toBe(true);
    expect(isItemInStock({ warehouse: "1" })).toBe(true);
    expect(isItemInStock({ warehouse: true })).toBe(true);
    expect(isItemInStock({ warehouse: 0 })).toBe(false);
    expect(isItemInStock({ warehouse: "0" })).toBe(false);
    expect(isItemInStock({})).toBe(false);
    expect(isItemInStock(undefined)).toBe(false);
  });
});

describe("resolveStockFields", () => {
  const out = { warehouse: 0, logistic_status: "assigned" };
  const shelf = { warehouse: 1, logistic_status: "in-stock" };

  it("leaves an assigned unit exactly where it was", () => {
    // The bug, in one assertion: this used to come back as warehouse 1.
    expect(resolveStockFields({ item: out, requestedState: "in-stock" })).toEqual({
      warehouse: 0,
      logistic_status: "assigned",
    });
  });

  it("ignores any requested state at all while the unit is out", () => {
    for (const state of ["in-stock", "in-transit", "lost", "", undefined]) {
      expect(resolveStockFields({ item: out, requestedState: state })).toEqual({
        warehouse: 0,
        logistic_status: "assigned",
      });
    }
  });

  it("applies a state the form owns when the unit is on the shelf", () => {
    expect(
      resolveStockFields({ item: shelf, requestedState: "in-transit" })
    ).toEqual({ warehouse: 1, logistic_status: "in-transit" });
  });

  it("derives warehouse from the state, so the two can never disagree", () => {
    expect(resolveStockFields({ item: shelf, requestedState: "lost" })).toEqual({
      warehouse: 0,
      logistic_status: "lost",
    });
  });

  it("refuses a state this form does not own, and keeps what was there", () => {
    // "assigned" and "in-event" are written by the flows that create the lease
    // or the event record. Typing them here would claim a handover nobody made.
    for (const state of ["assigned", "in-event", "nonsense"]) {
      expect(resolveStockFields({ item: shelf, requestedState: state })).toEqual({
        warehouse: 1,
        logistic_status: "in-stock",
      });
    }
  });

  it("falls back to in-stock when the record never carried a status", () => {
    expect(
      resolveStockFields({ item: { warehouse: 1 }, requestedState: undefined })
    ).toEqual({ warehouse: 1, logistic_status: "in-stock" });
  });
});

describe("EDITABLE_STOCK_STATES", () => {
  it("offers only the states a record edit can honestly claim", () => {
    expect(EDITABLE_STOCK_STATES.map((state) => state.value)).toEqual([
      "in-stock",
      "in-transit",
      "lost",
    ]);
  });

  it("carries the warehouse flag each state implies", () => {
    const byValue = Object.fromEntries(
      EDITABLE_STOCK_STATES.map((state) => [state.value, state.warehouse])
    );
    expect(byValue["in-stock"]).toBe(1);
    expect(byValue["in-transit"]).toBe(1);
    expect(byValue["lost"]).toBe(0);
  });
});

describe("buildEditItemFormValues — stock_state", () => {
  it("opens showing where the unit actually is", () => {
    expect(
      buildEditItemFormValues({ warehouse: 0, logistic_status: "assigned" })
        .stock_state
    ).toBe("assigned");
    expect(
      buildEditItemFormValues({ warehouse: 1, logistic_status: "in-transit" })
        .stock_state
    ).toBe("in-transit");
  });

  it("falls back to the flag when no status was stored", () => {
    expect(buildEditItemFormValues({ warehouse: 1 }).stock_state).toBe("in-stock");
    expect(buildEditItemFormValues({ warehouse: 0 }).stock_state).toBe("assigned");
  });
});
