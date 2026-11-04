import { describe, expect, it } from "vitest";
import { dataStructuringFormat } from "./dataStructuringFormat";

// The detail tables (category, group, brand, ownership) pass the inventory rows
// themselves, not the whole query object, so their memo can depend on the
// rows alone.
describe("dataStructuringFormat", () => {
  const listed = [
    { item_id: 1, serial_number: "A-1", item_group: "Radio" },
    { item_id: 2, serial_number: "A-2", item_group: "Radio" },
  ];
  const byType = { Radio: [{ image_url: "type.png" }] };

  it("keeps the listed items that are in the inventory rows, with their latest location", () => {
    const rows = [
      { serial_number: "A-1", location: "Old shelf", image_url: null },
      { serial_number: "A-1", location: "Main warehouse", image_url: "unit.png" },
    ];
    const result = dataStructuringFormat(listed, byType, rows);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      item_id: 1,
      location: "Main warehouse",
      image_url: "unit.png",
    });
  });

  it("falls back to the item type's image", () => {
    const rows = [{ serial_number: "A-2", location: "Aisle 3" }];
    expect(dataStructuringFormat(listed, byType, rows)[0].image_url).toBe("type.png");
  });

  it("is empty with no rows or no listed items", () => {
    expect(dataStructuringFormat(listed, byType, undefined)).toEqual([]);
    expect(dataStructuringFormat([], byType, [{ serial_number: "A-1" }])).toEqual([]);
  });
});
