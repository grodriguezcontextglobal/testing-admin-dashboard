import { describe, expect, it } from "vitest";
import { assignmentReferenceFill } from "./assignmentReferenceFill";

// AssignemntNewDeviceInInventory: picking an existing item group as the
// reference copies its fields into the "new device" form.
describe("assignmentReferenceFill", () => {
  const itemsByGroup = new Map([
    [
      "Radio",
      {
        item_group: "Radio",
        brand: "Motorola",
        location: "Main",
        serial_number: "A-9",
        container: "No",
        enableAssignFeature: 1,
        sub_location: '["Shelf 1","Bin 4"]',
        quantity: 7,
      },
    ],
  ]);

  it("copies the group's fields, turns the assign flag on and resets quantity", () => {
    const { values } = assignmentReferenceFill("Radio", itemsByGroup);
    const asObject = Object.fromEntries(values);
    expect(asObject).toMatchObject({
      item_group: "Radio",
      brand: "Motorola",
      location: "Main",
      enableAssignFeature: "Enabled",
      quantity: 0,
    });
    expect(asObject).not.toHaveProperty("serial_number");
    expect(asObject).not.toHaveProperty("container");
    expect(values.at(-1)).toEqual(["quantity", 0]);
  });

  it("hands back the group's sub-locations as a list, not as a form field", () => {
    const { values, subLocations } = assignmentReferenceFill("Radio", itemsByGroup);
    expect(subLocations).toEqual(["Shelf 1", "Bin 4"]);
    expect(Object.fromEntries(values)).not.toHaveProperty("sub_location");
  });

  it("copies an empty sub-location list into the form, as it always did", () => {
    const groups = new Map([["Tab", { item_group: "Tab", sub_location: "[]" }]]);
    const { values, subLocations } = assignmentReferenceFill("Tab", groups);
    expect(subLocations).toBeNull();
    expect(Object.fromEntries(values).sub_location).toBe("[]");
  });

  it("does nothing for a group that does not exist yet", () => {
    expect(assignmentReferenceFill("Tablets", itemsByGroup)).toEqual({
      values: [],
      subLocations: null,
    });
    expect(assignmentReferenceFill(undefined, itemsByGroup).values).toEqual([]);
  });
});
