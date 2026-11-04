import { describe, expect, it } from "vitest";
import { datasetToFilterOptions } from "./datasetToFilterOptions";

// The filter selects when the server does not paginate: every option comes from
// the rows already loaded, keyed by the select's category index.
describe("datasetToFilterOptions", () => {
  const rows = [
    { brand: "Motorola", item_group: "Radio", serial_number: "A-1", location: "Main", ownership: "Permanent", status: "Operational", logistic_status: "In stock", category_name: "Comms" },
    { brand: "Motorola", item_group: "Radio", serial_number: "A-2", location: "Aisle 3", ownership: "Rent", status: "Operational", logistic_status: "In use", category_name: "Comms" },
    { brand: "Apple", item_group: "Tablet", serial_number: "T-1", location: "Main", ownership: "Permanent", status: "Damaged", logistic_status: "In stock", category_name: "Devices" },
  ];

  it("lists each distinct value once, per select", () => {
    expect(datasetToFilterOptions(rows)).toEqual({
      0: ["Motorola", "Apple"],
      1: ["Radio", "Tablet"],
      2: ["A-1", "A-2", "T-1"],
      3: ["Main", "Aisle 3"],
      4: ["Permanent", "Rent"],
      5: ["Operational", "Damaged"],
      7: ["In stock", "In use"],
      8: ["Comms", "Devices"],
    });
  });

  it("has no staff-member select (index 6)", () => {
    expect(datasetToFilterOptions(rows)).not.toHaveProperty("6");
  });

  it("gives empty lists for no rows", () => {
    expect(datasetToFilterOptions(undefined)[0]).toEqual([]);
    expect(datasetToFilterOptions([])[8]).toEqual([]);
  });
});
