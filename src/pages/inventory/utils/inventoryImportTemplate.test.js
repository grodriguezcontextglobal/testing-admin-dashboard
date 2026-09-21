import { describe, expect, it } from "vitest";
import {
  INVENTORY_IMPORT_COLUMNS,
  RECOMMENDED_IMPORT_FIELDS,
  REQUIRED_IMPORT_FIELDS,
  columnForHeader,
  missingRequiredColumns,
  unknownColumns,
  buildGuideRow,
  buildTemplateRows,
  headerFor,
  isBlankImportValue,
  missingRequiredFields,
  normalizeHeader,
} from "./inventoryImportTemplate";

const headers = () => INVENTORY_IMPORT_COLUMNS.map((column) => column.header);
const fields = () => INVENTORY_IMPORT_COLUMNS.map((column) => column.field);

describe("INVENTORY_IMPORT_COLUMNS", () => {
  it("does not ask for a Company column — the importer injects it from the session", () => {
    expect(fields()).not.toContain("company");
    expect(fields()).not.toContain("company_id");
    expect(
      headers().some((header) => normalizeHeader(header).includes("company")),
    ).toBe(false);
  });

  it("does not document Status — no creation endpoint accepts it", () => {
    expect(fields()).not.toContain("status");
    expect(headers()).not.toContain("Status");
  });

  it("documents every field the parser still asks the sheet for", () => {
    expect(fields().sort()).toEqual(
      [
        "brand",
        "category_name",
        "cost",
        "descript_item",
        "extra_serial_number",
        "image_url",
        "item_group",
        "location",
        "main_warehouse",
        "ownership",
        "serial_number",
        "sub_location",
      ].sort(),
    );
  });

  // The parser still reads these two, but they are deliberately undocumented:
  // dropping the read as well would silently discard the values in sheets built
  // from the older template, which is worse than quietly accepting them.
  it("no longer offers Return Date or Supplier Info as columns", () => {
    expect(fields()).not.toContain("return_date");
    expect(fields()).not.toContain("supplier_info");
  });

  it("marks as mandatory exactly the fields the parser rejects a row without", () => {
    const required = INVENTORY_IMPORT_COLUMNS.filter((c) => c.required).map(
      (c) => c.field,
    );
    expect(required.sort()).toEqual([...REQUIRED_IMPORT_FIELDS].sort());
    expect(REQUIRED_IMPORT_FIELDS).toEqual([
      "category_name",
      "item_group",
      "serial_number",
      "cost",
      "brand",
      "ownership",
      "main_warehouse",
      "location",
    ]);
  });

  // The tier exists so the guide stops calling these "Optional": the row does
  // import without them, but it lands with no brand, a cost of 0 or no
  // ownership, and that has to be fixed one device at a time.
  it("keeps recommended and mandatory as separate tiers", () => {
    const recommended = INVENTORY_IMPORT_COLUMNS.filter((c) => c.recommended).map(
      (c) => c.field,
    );
    expect(recommended.sort()).toEqual([...RECOMMENDED_IMPORT_FIELDS].sort());
    expect(
      INVENTORY_IMPORT_COLUMNS.some((c) => c.required && c.recommended),
    ).toBe(false);
  });

  // A column that is both "you must fill this in" and "here is what we put when
  // you don't" cannot be read as anything coherent.


  it("uses unique headers and unique fields", () => {
    expect(new Set(headers()).size).toBe(headers().length);
    expect(new Set(fields()).size).toBe(fields().length);
  });




  // These four were added once so a spreadsheet could set them at all, and then
  // removed again: five yes/no questions per row confused more customers than
  // they served, and the answer was the same nearly every time. The importer now
  // fixes them (in stock, handout-enabled, not a container) and a unit that needs
  // otherwise is changed from the item page. Pinned so they are not reintroduced
  // by accident on one side only.
  it("no longer asks for the columns the importer now fills in itself", () => {
    for (const header of [
      "Warehouse",
      "Assignable",
      "Container",
      "Container Capacity",
      "Stored in container?",
    ]) {
      expect(headers()).not.toContain(header);
    }
  });
});

/* Fredrik, part 2 `5:51`: "delete for every single column here, also accepted
   as, all that, take it away." The header is the only spelling there is. */
describe("columnForHeader", () => {
  it("matches the documented header", () => {
    expect(columnForHeader("serial_number")?.field).toBe("serial_number");
  });

  it("forgives what Excel does to a header, and nothing else", () => {
    expect(columnForHeader("  serial_number*  ")?.field).toBe("serial_number");
    expect(columnForHeader("SERIAL_NUMBER")?.field).toBe("serial_number");
  });

  it("does not answer to a name nobody documented", () => {
    expect(columnForHeader("Serial No")).toBeUndefined();
    /* The pretty names the template used to carry are not columns any more —
       a column is the field the request sends, and nothing else. */
    expect(columnForHeader("Serial Number")).toBeUndefined();
    expect(columnForHeader("Taxable Location")).toBeUndefined();
    expect(columnForHeader("Device Name")).toBeUndefined();
    expect(columnForHeader("")).toBeUndefined();
  });
});

describe("telling someone their columns are wrong", () => {
  const everyHeader = () => INVENTORY_IMPORT_COLUMNS.map((column) => column.header);

  it("finds nothing missing in a file built from the template", () => {
    expect(missingRequiredColumns(everyHeader())).toEqual([]);
    expect(unknownColumns(everyHeader())).toEqual([]);
  });

  /* The reason this exists: without it, a renamed column makes every row fail
     its mandatory check, so a 500-row file reports 500 skipped rows and never
     says which column was renamed. */
  it("names the mandatory column a renamed header left missing", () => {
    const headers = everyHeader().map((header) =>
      header === "category_name" ? "Type" : header
    );

    expect(missingRequiredColumns(headers)).toEqual(["category_name"]);
    expect(unknownColumns(headers)).toEqual(["Type"]);
  });

  it("does not complain about a missing optional column", () => {
    expect(
      missingRequiredColumns(everyHeader().filter((h) => h !== "descript_item"))
    ).toEqual([]);
  });

  it("ignores a blank trailing header, which Excel adds on its own", () => {
    expect(unknownColumns([...everyHeader(), "", "   "])).toEqual([]);
  });
});

describe("buildTemplateRows", () => {
  const rows = buildTemplateRows();

  it("produces one row per documented sample", () => {
    expect(rows).toHaveLength(3);
  });

  it("keys every row by the documented headers and nothing else", () => {
    for (const row of rows) {
      expect(Object.keys(row)).toEqual(headers());
    }
  });

  it("fills the mandatory columns in every sample row", () => {
    for (const row of rows) {
      for (const column of INVENTORY_IMPORT_COLUMNS.filter((c) => c.required)) {
        expect(String(row[column.header]).trim()).not.toBe("");
      }
    }
  });

  it("uses the key=value;key=value shape the parser expects for Extra Info", () => {
    const filled = rows
      .map((row) => row["extra_serial_number"])
      .filter((value) => String(value).trim() !== "");
    expect(filled.length).toBeGreaterThan(0);
    for (const value of filled) {
      for (const pair of String(value).split(";")) {
        expect(pair).toContain("=");
      }
    }
  });
});

describe("buildGuideRow", () => {
  it("keys the guide table row by field, matching the antd dataIndex", () => {
    const row = buildGuideRow();
    for (const field of fields()) {
      expect(row).toHaveProperty(field);
    }
    expect(row).toHaveProperty("key");
  });
});

describe("headerFor", () => {
  it("reads a field's display name from its column definition", () => {
    /* A column is named after the field it carries, so the two are the same
       string. `BulkItemsFields.jsx` calls the taxable location `tax_location`
       on the manual form and translates it on the way out
       (`main_warehouse: data.tax_location`); what reaches the server, and so
       what the column is called, is `main_warehouse`. */
    expect(headerFor("main_warehouse")).toBe("main_warehouse");
    expect(headerFor("category_name")).toBe("category_name");
  });

  it("falls back to the raw field name for one it does not recognize", () => {
    expect(headerFor("not_a_real_field")).toBe("not_a_real_field");
  });
});

describe("isBlankImportValue", () => {
  it("treats an empty string, undefined and null as blank", () => {
    expect(isBlankImportValue("")).toBe(true);
    expect(isBlankImportValue(undefined)).toBe(true);
    expect(isBlankImportValue(null)).toBe(true);
  });

  it("does not treat 0 or whitespace-only text as blank — only an empty cell is", () => {
    expect(isBlankImportValue(0)).toBe(false);
    expect(isBlankImportValue(" ")).toBe(false);
  });

  it("treats any filled value as not blank", () => {
    expect(isBlankImportValue("Miami, FL")).toBe(false);
    expect(isBlankImportValue(45.5)).toBe(false);
  });
});

describe("missingRequiredFields", () => {
  const filledRow = () => ({
    category_name: "Electronics",
    item_group: "Laptop",
    serial_number: "SN-1",
    cost: "540",
    brand: "Dell",
    ownership: "Rent",
    main_warehouse: "Miami, FL",
    location: "Miami, FL",
  });

  it("returns nothing when every required field is filled", () => {
    expect(missingRequiredFields(filledRow())).toEqual([]);
  });

  it("names each required field a row left blank, in REQUIRED_IMPORT_FIELDS order", () => {
    const row = { ...filledRow(), brand: "", location: "" };
    expect(missingRequiredFields(row)).toEqual(["brand", "location"]);
  });

  it("treats a required field missing from the row the same as a blank cell", () => {
    const { cost, ...row } = filledRow();
    void cost;
    expect(missingRequiredFields(row)).toEqual(["cost"]);
  });

  it("checks only the fields passed in, when given a narrower list", () => {
    const row = { category_name: "", item_group: "Laptop" };
    expect(missingRequiredFields(row, ["item_group"])).toEqual([]);
    expect(missingRequiredFields(row, ["category_name"])).toEqual(["category_name"]);
  });
});
