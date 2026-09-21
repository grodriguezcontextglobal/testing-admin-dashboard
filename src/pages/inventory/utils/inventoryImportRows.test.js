import { describe, expect, it } from "vitest";

import {
  parseCost,
  parseInventoryImportRows,
  parseSubLocation,
  readField,
} from "./inventoryImportRows";

const sheetRow = (overrides = {}) => ({
  Category: "Audio",
  Group: "Wireless Microphone",
  "Serial Number": "AUD-2026-000001",
  Cost: 258.42,
  Brand: "Shure",
  Description: "Wireless handheld microphone for event audio",
  Ownership: "Permanent",
  "Taxable Location": "Miami, FL",
  Location: "Miami, FL",
  "Sub Locations": "Section A, Locker A110",
  "Extra Info": "Band=G50;Type=Handheld",
  Image: "",
  ...overrides,
});

describe("reading a field through its aliases", () => {
  it("takes the header the template writes", () => {
    expect(readField(sheetRow(), "main_warehouse")).toBe("Miami, FL");
  });

  it("forgives casing, space and the mandatory asterisk", () => {
    expect(readField({ "  serial number* ": "SN-1" }, "serial_number")).toBe("SN-1");
  });

  it("returns blank rather than undefined for a column that is not there", () => {
    expect(readField({}, "supplier_info")).toBe("");
  });
});

describe("the two columns that need decoding", () => {
  it("accepts a decimal comma, because half the world writes one", () => {
    expect(parseCost("45,5")).toBe(45.5);
    expect(parseCost("45.5")).toBe(45.5);
    expect(parseCost("")).toBe(0);
    expect(parseCost("not a number")).toBe(0);
  });

  it("splits a sub-location path and survives a round-trip through export", () => {
    expect(parseSubLocation("Section A, Locker A110")).toEqual([
      "Section A",
      "Locker A110",
    ]);
    expect(parseSubLocation('["Section A","Locker A110"]')).toEqual([
      "Section A",
      "Locker A110",
    ]);
    expect(parseSubLocation("")).toEqual([]);
    expect(parseSubLocation("null")).toEqual([]);
  });
});

describe("reading the rows", () => {
  it("keeps every value on the unit it belongs to", () => {
    const { units } = parseInventoryImportRows([sheetRow()]);

    expect(units).toHaveLength(1);
    expect(units[0]).toMatchObject({
      rowNumber: 2,
      category_name: "Audio",
      item_group: "Wireless Microphone",
      serial_number: "AUD-2026-000001",
      cost: 258.42,
      ownership: "Permanent",
      main_warehouse: "Miami, FL",
      location: "Miami, FL",
      sub_location: ["Section A", "Locker A110"],
    });
  });

  it("maps a synonym onto one of the three ownership values", () => {
    const { units } = parseInventoryImportRows([sheetRow({ Ownership: "Lease" })]);

    expect(units[0].ownership).toBe("Rent");
  });

  it("composes a description only when the column is blank", () => {
    const { units } = parseInventoryImportRows([
      sheetRow({ Description: "" }),
      sheetRow({ "Serial Number": "AUD-2", Description: "Written by hand" }),
    ]);

    expect(units[0].descript_item).toBe(
      "Audio Wireless Microphone Shure Miami, FL"
    );
    expect(units[1].descript_item).toBe("Written by hand");
  });

  /* The old parser returned null for these and filtered them out, so a file
     half of which was unusable still reported the other half as a success. */
  it("reports a skipped row and what it was missing", () => {
    const { units, skipped } = parseInventoryImportRows([
      sheetRow(),
      sheetRow({ "Serial Number": "", Cost: "" }),
    ]);

    expect(units).toHaveLength(1);
    expect(skipped).toEqual([
      { rowNumber: 3, missing: ["Serial Number", "Cost"] },
    ]);
  });

  it("numbers rows the way the spreadsheet does, so a message can point at one", () => {
    const { units } = parseInventoryImportRows([
      sheetRow(),
      sheetRow({ "Serial Number": "AUD-2" }),
    ]);

    expect(units.map((unit) => unit.rowNumber)).toEqual([2, 3]);
  });
});

describe("the picture in the Image cell", () => {
  it("attaches the file the cell pointed at to that row's unit", () => {
    const imagesByRow = new Map([
      [3, { mediaPath: "xl/media/image1.jpeg", alt: "Light blue headphones" }],
    ]);

    const { units } = parseInventoryImportRows(
      [sheetRow(), sheetRow({ "Serial Number": "AUD-2" })],
      { imagesByRow }
    );

    expect(units[0].imageMediaPath).toBeNull();
    expect(units[1].imageMediaPath).toBe("xl/media/image1.jpeg");
    expect(units[1].imageAlt).toBe("Light blue headphones");
  });

  /* A cell holding a picture reads as blank, so text in that column was typed
     by hand — and a pasted URL is what part 2 `9:38` ruled out. It is not used,
     and dropping it silently would be the same loss this rewrite exists to
     stop, so it comes back as something the preview can say out loud. */
  it("reports a URL typed into the Image column instead of ignoring it", () => {
    const { units, ignoredImageValues } = parseInventoryImportRows([
      sheetRow({ Image: "https://example.com/mic.jpg" }),
      sheetRow({ "Serial Number": "AUD-2" }),
    ]);

    expect(units[0].imageMediaPath).toBeNull();
    expect(ignoredImageValues).toEqual([
      { rowNumber: 2, value: "https://example.com/mic.jpg" },
    ]);
  });

  it("says nothing about a file where nobody typed in that column", () => {
    expect(
      parseInventoryImportRows([sheetRow()]).ignoredImageValues
    ).toEqual([]);
  });

  /* A skipped row must not shift the ones after it onto the wrong picture. */
  it("keeps the rows aligned when one in the middle is skipped", () => {
    const imagesByRow = new Map([[4, { mediaPath: "xl/media/image2.jpeg", alt: "" }]]);

    const { units } = parseInventoryImportRows(
      [
        sheetRow(),
        sheetRow({ "Serial Number": "" }),
        sheetRow({ "Serial Number": "AUD-3" }),
      ],
      { imagesByRow }
    );

    expect(units).toHaveLength(2);
    expect(units[1].rowNumber).toBe(4);
    expect(units[1].imageMediaPath).toBe("xl/media/image2.jpeg");
  });
});
