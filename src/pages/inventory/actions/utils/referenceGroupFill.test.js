import { describe, expect, it } from "vitest";
import { referenceGroupFormValues } from "./referenceGroupFill";

// AddNewItem: picking an existing item group as the reference copies that
// group's fields into the form; typing a new one only names the group.
const asObject = (entries) => Object.fromEntries(entries);

describe("referenceGroupFormValues", () => {
  const itemsByGroup = new Map([
    [
      "Radio",
      {
        item_group: "Radio",
        category_name: "Comms",
        brand: "Motorola",
        cost: "120",
        serial_number: "A-9",
        location: "Main",
        sub_location: '["Shelf 1"]',
        container: "No",
        enableAssignFeature: 1,
        quantity: 7,
      },
    ],
  ]);

  it("copies the reference group's fields, but not its unit-specific ones", () => {
    const values = asObject(referenceGroupFormValues("Radio", itemsByGroup));
    expect(values).toMatchObject({
      item_group: "Radio",
      category_name: "Comms",
      brand: "Motorola",
      cost: "120",
      quantity: 0,
    });
    for (const skipped of ["serial_number", "location", "sub_location", "container", "enableAssignFeature"]) {
      expect(values).not.toHaveProperty(skipped);
    }
  });

  it("sets quantity last, so a copied quantity never survives", () => {
    const entries = referenceGroupFormValues("Radio", itemsByGroup);
    expect(entries.at(-1)).toEqual(["quantity", 0]);
  });

  it("a new group name only names the group", () => {
    expect(referenceGroupFormValues("Tablets", itemsByGroup)).toEqual([["item_group", "Tablets"]]);
  });

  it("clearing the reference clears the form", () => {
    const values = asObject(referenceGroupFormValues("", itemsByGroup));
    expect(values).toEqual({
      item_group: "",
      photo: [],
      category_name: "",
      cost: "",
      brand: "",
      descript_item: "",
      min_serial_number: "",
      max_serial_number: "",
      sub_location: "",
      quantity: 0,
      container: "",
      containerSpotLimit: "0",
      enabledAssignFeature: 1,
    });
  });
});
