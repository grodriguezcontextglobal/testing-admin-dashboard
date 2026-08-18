import { describe, expect, it } from "vitest";
import {
  INVENTORY_IMPORT_COLUMNS,
  RECOMMENDED_IMPORT_FIELDS,
  REQUIRED_IMPORT_FIELDS,
  aliasesFor,
  buildGuideRow,
  buildTemplateRows,
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

  it("marks as mandatory exactly the three fields the parser rejects a row without", () => {
    const required = INVENTORY_IMPORT_COLUMNS.filter((c) => c.required).map(
      (c) => c.field,
    );
    expect(required.sort()).toEqual([...REQUIRED_IMPORT_FIELDS].sort());
    expect(REQUIRED_IMPORT_FIELDS).toEqual([
      "category_name",
      "item_group",
      "serial_number",
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
  it("never claims a default for a mandatory column", () => {
    for (const column of INVENTORY_IMPORT_COLUMNS.filter((c) => c.required)) {
      expect(column.defaultNote).toBeUndefined();
    }
  });

  it("says what happens when a recommended column is left blank", () => {
    for (const column of INVENTORY_IMPORT_COLUMNS.filter((c) => c.recommended)) {
      expect(column.defaultNote).toBeTruthy();
    }
  });

  it("uses unique headers and unique fields", () => {
    expect(new Set(headers()).size).toBe(headers().length);
    expect(new Set(fields()).size).toBe(fields().length);
  });

  it("accepts its own header as an alias, so the downloaded template parses back", () => {
    for (const column of INVENTORY_IMPORT_COLUMNS) {
      const normalized = column.aliases.map(normalizeHeader);
      expect(normalized).toContain(normalizeHeader(column.header));
    }
  });

  it("keeps the snake_case field name as an alias", () => {
    for (const column of INVENTORY_IMPORT_COLUMNS) {
      expect(column.aliases).toContain(column.field);
    }
  });

  it("never lets one column's alias swallow another column's header", () => {
    for (const column of INVENTORY_IMPORT_COLUMNS) {
      const others = INVENTORY_IMPORT_COLUMNS.filter((c) => c !== column);
      for (const other of others) {
        expect(column.aliases.map(normalizeHeader)).not.toContain(
          normalizeHeader(other.header),
        );
      }
    }
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

describe("aliasesFor", () => {
  it("returns the alias list for a known field", () => {
    expect(aliasesFor("category_name")).toContain("Category");
  });

  it("returns an empty list for an unknown field rather than throwing", () => {
    expect(aliasesFor("not_a_field")).toEqual([]);
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
      .map((row) => row["Extra Info"])
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
