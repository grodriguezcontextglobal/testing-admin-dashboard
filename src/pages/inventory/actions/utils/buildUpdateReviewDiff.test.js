import { describe, expect, it } from "vitest";
import { buildUpdateReviewDiff } from "./buildUpdateReviewDiff";

const FIELDS = [
  { field: "brand", label: "Brand" },
  { field: "cost", label: "Cost per unit" },
  { field: "location", label: "Location" },
];

describe("buildUpdateReviewDiff", () => {
  it("returns nothing when the form matches the group's values", () => {
    const summary = { brand: { value: "Apple" }, cost: { value: 180 }, location: { value: "Miami" } };
    const form = { brand: "Apple", cost: 180, location: "Miami" };
    expect(buildUpdateReviewDiff(summary, form, FIELDS)).toEqual([]);
  });

  it("reports only the field that changed", () => {
    const summary = { brand: { value: "Apple" }, cost: { value: 180 }, location: { value: "Miami" } };
    const form = { brand: "Apple", cost: 210, location: "Miami" };
    expect(buildUpdateReviewDiff(summary, form, FIELDS)).toEqual([
      { field: "cost", label: "Cost per unit", from: 180, to: 210 },
    ]);
  });

  it("reports every field that changed, in field order", () => {
    const summary = { brand: { value: "Apple" }, cost: { value: 180 }, location: { value: "Miami" } };
    const form = { brand: "Samsung", cost: 180, location: "Orlando" };
    expect(buildUpdateReviewDiff(summary, form, FIELDS)).toEqual([
      { field: "brand", label: "Brand", from: "Apple", to: "Samsung" },
      { field: "location", label: "Location", from: "Miami", to: "Orlando" },
    ]);
  });

  it("treats null, undefined and empty string as the same blank value", () => {
    const summary = { brand: { value: null } };
    const form = { brand: "" };
    expect(buildUpdateReviewDiff(summary, form, [{ field: "brand", label: "Brand" }])).toEqual([]);
  });

  it("treats a missing field in either side as blank rather than throwing", () => {
    expect(buildUpdateReviewDiff({}, {}, FIELDS)).toEqual([]);
    expect(buildUpdateReviewDiff(undefined, undefined, FIELDS)).toEqual([]);
  });

  it("compares numbers and their string form as equal", () => {
    const summary = { cost: { value: 180 } };
    const form = { cost: "180" };
    expect(buildUpdateReviewDiff(summary, form, [{ field: "cost", label: "Cost" }])).toEqual([]);
  });
});
