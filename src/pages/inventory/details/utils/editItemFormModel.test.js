import { describe, expect, it } from "vitest";
import {
  buildEditItemFormValues,
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
