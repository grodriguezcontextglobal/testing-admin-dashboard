import { describe, expect, it } from "vitest";

import {
  IMPORT_DEFAULTS,
  MAX_IMPORT_UNITS,
  buildSpreadsheetImportRequest,
  describeImportRejection,
  describeImportResult,
  spreadsheetRowFor,
} from "./spreadsheetImportRequest";

const unit = (overrides = {}) => ({
  rowNumber: 2,
  serial_number: "AUD-1",
  category_name: "Audio",
  item_group: "Wireless Microphone",
  brand: "Shure",
  descript_item: "Wireless handheld microphone",
  cost: 258.42,
  ownership: "Permanent",
  location: "Miami, FL",
  main_warehouse: "Miami, FL",
  sub_location: ["Section A", "Locker A110"],
  extra_serial_number: "Band=G50;Type=Handheld",
  imageMediaPath: null,
  ...overrides,
});

const build = (units, extra = {}) =>
  buildSpreadsheetImportRequest({
    units,
    company: "ABC Interpreting",
    companyId: 7,
    ...extra,
  });

describe("the body", () => {
  it("sends one object per unit, each with its own values", () => {
    const { body } = build([
      unit({ serial_number: "AUD-1", cost: 258.42, location: "Miami, FL" }),
      unit({ serial_number: "AUD-2", cost: 235.56, location: "Orlando, FL" }),
    ]);

    expect(body.units).toHaveLength(2);
    expect(body.units.map((u) => u.cost)).toEqual([258.42, 235.56]);
    expect(body.units.map((u) => u.location)).toEqual([
      "Miami, FL",
      "Orlando, FL",
    ]);
  });

  /* The whole point of the new endpoint: nothing is grouped, so nothing has to
     agree, so no value is ever left out. */
  it("never omits a field because units disagree on it", () => {
    const { body } = build([unit(), unit({ serial_number: "AUD-2", cost: 1 })]);

    for (const sent of body.units) {
      expect(sent).toHaveProperty("cost");
      expect(sent).toHaveProperty("location");
      expect(sent).toHaveProperty("main_warehouse");
    }
  });

  it("carries the extra identifiers as this unit's own list", () => {
    const { body } = build([unit()]);

    expect(body.units[0].extra_serial_number).toEqual([
      { keyObject: "Band", valueObject: "G50" },
      { keyObject: "Type", valueObject: "Handheld" },
    ]);
  });

  it("sends the uploaded picture, and an empty string when there is none", () => {
    const { body } = build(
      [
        unit({ serial_number: "A-1", imageMediaPath: "xl/media/image1.jpeg" }),
        unit({ serial_number: "A-2" }),
      ],
      {
        imageUrlByMediaPath: new Map([
          ["xl/media/image1.jpeg", "https://res.cloudinary.com/x/1.jpg"],
        ]),
      }
    );

    expect(body.units[0].image_url).toBe("https://res.cloudinary.com/x/1.jpg");
    expect(body.units[1].image_url).toBe("");
  });

  it("sends the company and the fixed defaults", () => {
    const { body } = build([unit()]);

    expect(body.company_id).toBe(7);
    expect(body.company).toBe("ABC Interpreting");
    expect(body.defaults).toEqual(IMPORT_DEFAULTS);
    /* Left out, a unit is created invisible. */
    expect(body.defaults.display_item).toBe(1);
  });

  it("agrees with the server's ceiling", () => {
    expect(MAX_IMPORT_UNITS).toBe(10000);
  });
});

/* The server reports a row as the unit's place in the array plus the header
   line, which is all it can see. A file with a skipped row in the middle makes
   that a different row from the one the person is looking at. */
describe("pointing at the row someone has to fix", () => {
  it("translates the reported position back to the spreadsheet row", () => {
    // Row 7 was skipped, so unit 2 of the array is really row 8.
    const rowByIndex = [2, 8, 9];

    expect(spreadsheetRowFor(2, rowByIndex)).toBe(2);
    expect(spreadsheetRowFor(3, rowByIndex)).toBe(8);
    expect(spreadsheetRowFor(4, rowByIndex)).toBe(9);
  });

  it("is an identity when no row was skipped", () => {
    expect(spreadsheetRowFor(5, [2, 3, 4, 5])).toBe(5);
  });

  it("gives the number back rather than nothing when it cannot map it", () => {
    expect(spreadsheetRowFor(99, [2, 3])).toBe(99);
    expect(spreadsheetRowFor(undefined, [2])).toBeNull();
  });

  it("is built from the units that were actually sent", () => {
    const { rowByIndex } = build([
      unit({ rowNumber: 2 }),
      unit({ serial_number: "AUD-2", rowNumber: 8 }),
    ]);

    expect(rowByIndex).toEqual([2, 8]);
  });
});

describe("saying why an import was refused", () => {
  it("names the first row and what is wrong with it", () => {
    const rejection = describeImportRejection(
      {
        msg: "2 row(s) cannot be imported.",
        errors: [
          { row: 3, reason: "serial_number is required" },
          { row: 9, reason: "category_name is required" },
        ],
      },
      [2, 8, 14]
    );

    expect(rejection).toBe(
      "Row 8: serial_number is required (and 1 more row(s)). Fix the file and import again."
    );
  });

  it("falls back to the server's own sentence when there are no rows", () => {
    expect(
      describeImportRejection({ msg: "Company mismatch between header and body" })
    ).toBe("Company mismatch between header and body");
  });
});

describe("summarising what the job did", () => {
  it("counts what went in, what was created and what did not", () => {
    expect(
      describeImportResult(
        {
          inserted: 478,
          total: 498,
          locationsCreated: 2,
          failedCount: 20,
          failed: [
            { serial_number: "AUD-12", row: 3, reason: "serial number already exists in this company" },
          ],
        },
        [2, 8]
      )
    ).toBe(
      "478 unit(s) added, 2 location(s) created, 20 not added — first is row 8: serial number already exists in this company."
    );
  });

  /* `failed` is capped at 500 entries, so the count and the list's length are
     not the same number and the summary has to read the count. */
  it("reports the real total, not the length of a truncated list", () => {
    expect(
      describeImportResult({
        inserted: 1,
        failedCount: 900,
        failed: new Array(500).fill({ reason: "x" }),
        failedTruncated: true,
      })
    ).toContain("900 not added");
  });

  it("says the simple thing when nothing failed", () => {
    expect(describeImportResult({ inserted: 500, failedCount: 0 })).toBe(
      "500 unit(s) added."
    );
  });
});
