import { describe, expect, it } from "vitest";
import {
  formatTrackedFieldValue,
  summarizeInventoryMatches,
  TRACKED_FIELDS,
} from "./updateInventoryMatchSummary";

const item = (overrides = {}) => ({
  serial_number: "SN-1",
  brand: "Apple",
  cost: 180,
  ownership: "Rent",
  location: "Fort Lauderdale, FL",
  logistic_status: "in-stock",
  warehouse: 1,
  ...overrides,
});

describe("summarizeInventoryMatches", () => {
  it("returns an empty-but-shaped summary for no matches", () => {
    const summary = summarizeInventoryMatches([]);
    expect(summary.matchCount).toBe(0);
    expect(summary.costRange).toBeNull();
    expect(summary.fields).toEqual({});
  });

  it("treats a non-array input the same as no matches", () => {
    expect(summarizeInventoryMatches(undefined).matchCount).toBe(0);
    expect(summarizeInventoryMatches(null).matchCount).toBe(0);
  });

  it("counts distinct locations and ownership types", () => {
    const summary = summarizeInventoryMatches([
      item({ location: "Miami, FL", ownership: "Rent" }),
      item({ location: "Miami, FL", ownership: "Permanent" }),
      item({ location: "Orlando, FL", ownership: "Rent" }),
    ]);
    expect(summary.matchCount).toBe(3);
    expect(summary.locationCount).toBe(2);
    expect(summary.ownershipTypeCount).toBe(2);
  });

  it("computes the cost range across the group, ignoring non-numeric cost", () => {
    const summary = summarizeInventoryMatches([
      item({ cost: 180 }),
      item({ cost: 240 }),
      item({ cost: "" }),
      item({ cost: undefined }),
    ]);
    expect(summary.costRange).toEqual({ min: 180, max: 240 });
  });

  it("splits in-warehouse vs elsewhere using logistic_status", () => {
    const summary = summarizeInventoryMatches([
      item({ logistic_status: "in-stock" }),
      item({ logistic_status: "in-event" }),
      item({ logistic_status: "assigned" }),
    ]);
    expect(summary.inWarehouseCount).toBe(1);
    expect(summary.elsewhereCount).toBe(2);
  });

  it("falls back to the warehouse flag when logistic_status is missing", () => {
    const summary = summarizeInventoryMatches([
      item({ logistic_status: undefined, warehouse: 1 }),
      item({ logistic_status: undefined, warehouse: 0 }),
    ]);
    expect(summary.inWarehouseCount).toBe(1);
    expect(summary.elsewhereCount).toBe(1);
  });

  it("marks a tracked field mixed only when the group disagrees", () => {
    const summary = summarizeInventoryMatches([
      item({ brand: "Apple" }),
      item({ brand: "Apple" }),
    ]);
    expect(summary.fields.brand).toEqual({
      value: "Apple",
      mixed: false,
      distinctCount: 1,
    });

    const mixed = summarizeInventoryMatches([
      item({ brand: "Apple" }),
      item({ brand: "Samsung" }),
    ]);
    expect(mixed.fields.brand.mixed).toBe(true);
    expect(mixed.fields.brand.distinctCount).toBe(2);
  });

  it("uses the first filled value as the representative, ignoring blanks", () => {
    const summary = summarizeInventoryMatches([
      item({ supplier_info: "" }),
      item({ supplier_info: "Invoxia Supply Co." }),
    ]);
    expect(summary.fields.supplier_info.value).toBe("Invoxia Supply Co.");
    expect(summary.fields.supplier_info.mixed).toBe(false);
  });

  it("reports null for a tracked field nobody in the group has set", () => {
    const summary = summarizeInventoryMatches([item({ supplier_info: undefined })]);
    expect(summary.fields.supplier_info).toEqual({
      value: null,
      mixed: false,
      distinctCount: 0,
    });
  });

  it("covers every tracked field", () => {
    const summary = summarizeInventoryMatches([item()]);
    TRACKED_FIELDS.forEach(({ field }) => {
      expect(summary.fields).toHaveProperty(field);
    });
  });
});

describe("formatTrackedFieldValue", () => {
  it("returns null for a blank value", () => {
    expect(formatTrackedFieldValue("brand", null)).toBeNull();
    expect(formatTrackedFieldValue("brand", undefined)).toBeNull();
    expect(formatTrackedFieldValue("brand", "")).toBeNull();
  });

  it("reads a tinyint container/enableAssignFeature value as Yes or No", () => {
    expect(formatTrackedFieldValue("container", 1)).toBe("Yes");
    expect(formatTrackedFieldValue("container", 0)).toBe("No");
    expect(formatTrackedFieldValue("enableAssignFeature", 1)).toBe("Yes");
    expect(formatTrackedFieldValue("enableAssignFeature", 0)).toBe("No");
  });

  it("reads the form's radio-option strings for the same boolean fields", () => {
    expect(formatTrackedFieldValue("container", "Yes - It is a container")).toBe("Yes");
    expect(formatTrackedFieldValue("container", "No - It is not a container")).toBe("No");
    expect(formatTrackedFieldValue("enableAssignFeature", "YES")).toBe("Yes");
    expect(formatTrackedFieldValue("enableAssignFeature", "NO")).toBe("No");
  });

  it("joins a sub_location array into one readable path", () => {
    expect(formatTrackedFieldValue("sub_location", ["Miami, FL", "Rack A", "Shelf 1"])).toBe(
      "Miami, FL / Rack A / Shelf 1",
    );
  });

  it("parses a JSON-stringified sub_location into the same readable path", () => {
    expect(formatTrackedFieldValue("sub_location", JSON.stringify(["Miami, FL", "Rack A"]))).toBe(
      "Miami, FL / Rack A",
    );
  });

  it("shows a plain non-JSON sub_location string as-is", () => {
    expect(formatTrackedFieldValue("sub_location", "Miami, FL")).toBe("Miami, FL");
  });

  it("formats cost as currency", () => {
    expect(formatTrackedFieldValue("cost", 180)).toBe("$180.00");
    expect(formatTrackedFieldValue("cost", "540.00")).toBe("$540.00");
  });

  it("leaves every other tracked field as plain text", () => {
    expect(formatTrackedFieldValue("brand", "Apple")).toBe("Apple");
    expect(formatTrackedFieldValue("location", "Miami, FL")).toBe("Miami, FL");
  });
});
