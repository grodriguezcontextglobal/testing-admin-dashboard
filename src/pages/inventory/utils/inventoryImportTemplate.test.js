import { describe, expect, it } from "vitest";
import {
  INVENTORY_IMPORT_COLUMNS,
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

  it("covers every field the XLSX parser reads", () => {
    expect(fields().sort()).toEqual(
      [
        "brand",
        "category_name",
        "container",
        "containerSpotLimit",
        "cost",
        "descript_item",
        "enableAssignFeature",
        "extra_serial_number",
        "image_url",
        "isItInContainer",
        "item_group",
        "location",
        "main_warehouse",
        "ownership",
        "return_date",
        "serial_number",
        "sub_location",
        "supplier_info",
        "warehouse",
      ].sort(),
    );
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

  it("documents the container and assignability columns that used to be missing", () => {
    expect(headers()).toEqual(
      expect.arrayContaining([
        "Assignable",
        "Container",
        "Container Capacity",
        "Stored in container?",
      ]),
    );
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
