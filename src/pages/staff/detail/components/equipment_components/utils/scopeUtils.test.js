import { describe, it, expect } from "vitest";
import {
  buildScopePayload,
  dedupeCategories,
  validateScopeSelection,
} from "./scopeUtils";

// ─── dedupeCategories ─────────────────────────────────────────────────────────
// Backend §5.5: category multi-select must dedupe by category_name (stale /
// duplicate category lists across items). Preserve the first category_id seen.

describe("dedupeCategories", () => {
  it("returns an empty array for null/undefined/non-array input", () => {
    expect(dedupeCategories(null)).toEqual([]);
    expect(dedupeCategories(undefined)).toEqual([]);
    expect(dedupeCategories("not an array")).toEqual([]);
  });

  it("returns the array unchanged when every category_name is unique", () => {
    const input = [
      { category_id: 1, category_name: "Cameras" },
      { category_id: 2, category_name: "Lenses" },
    ];
    expect(dedupeCategories(input)).toEqual(input);
  });

  it("dedupes by category_name, keeping the first occurrence's category_id", () => {
    const input = [
      { category_id: 1, category_name: "Cameras" },
      { category_id: 99, category_name: "Cameras" },
      { category_id: 2, category_name: "Lenses" },
    ];
    const result = dedupeCategories(input);
    expect(result).toHaveLength(2);
    expect(result.find((c) => c.category_name === "Cameras").category_id).toBe(1);
  });

  it("ignores entries without a category_name", () => {
    const input = [
      { category_id: 1, category_name: "Cameras" },
      { category_id: 2 },
    ];
    expect(dedupeCategories(input)).toEqual([{ category_id: 1, category_name: "Cameras" }]);
  });
});

// ─── validateScopeSelection ───────────────────────────────────────────────────
// Fail-closed guard (review R6): a scoped role with zero assignments cannot
// see any inventory, so the UI must block saving with no selection.

describe("validateScopeSelection", () => {
  it("is valid (no message) for a non-scoped roleType regardless of selection", () => {
    expect(validateScopeSelection("admin", [])).toEqual({ valid: true, message: "" });
    expect(validateScopeSelection("event_manager", [])).toEqual({ valid: true, message: "" });
  });

  it("is invalid for a location-scoped role with an empty selection", () => {
    const result = validateScopeSelection("inventory_location_manager", []);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/at least one location/i);
  });

  it("is invalid for a category-scoped role with an empty/undefined selection", () => {
    expect(validateScopeSelection("category_manager", []).valid).toBe(false);
    expect(validateScopeSelection("category_assistant", undefined).valid).toBe(false);
    expect(validateScopeSelection("category_manager", []).message).toMatch(/at least one category/i);
  });

  it("is valid for a scoped role with at least one selection", () => {
    expect(validateScopeSelection("inventory_location_assistant", ["Warehouse A"])).toEqual({
      valid: true,
      message: "",
    });
    expect(validateScopeSelection("category_assistant", ["Cameras"])).toEqual({
      valid: true,
      message: "",
    });
  });
});

// ─── buildScopePayload ────────────────────────────────────────────────────────
// Backend §4: PUT /db_staff/company-staff/scope. Send ONLY the dimension that
// matches the role (wrong key => 400); ids must be numeric; full-replace.

describe("buildScopePayload", () => {
  const identity = { company_id: 62, staff_id: 158 };

  it("sends `categories` (numeric) for a category-scoped role", () => {
    expect(buildScopePayload("category_manager", [11, 12], identity)).toEqual({
      company_id: 62,
      staff_id: 158,
      categories: [11, 12],
    });
  });

  it("sends `locations` (numeric) for a location-scoped role", () => {
    expect(
      buildScopePayload("inventory_location_manager", [3, 7], identity)
    ).toEqual({ company_id: 62, staff_id: 158, locations: [3, 7] });
  });

  it("coerces string ids to numbers and drops non-numeric entries", () => {
    expect(buildScopePayload("category_assistant", ["11", "x", 12], identity)).toEqual(
      { company_id: 62, staff_id: 158, categories: [11, 12] }
    );
  });

  it("emits an empty array (full-replace clear) for an empty/undefined selection", () => {
    expect(buildScopePayload("category_manager", [], identity)).toEqual({
      company_id: 62,
      staff_id: 158,
      categories: [],
    });
    expect(buildScopePayload("category_manager", undefined, identity)).toEqual({
      company_id: 62,
      staff_id: 158,
      categories: [],
    });
  });

  it("omits any dimension key for a non-scoped role", () => {
    expect(buildScopePayload("admin", [1, 2], identity)).toEqual({
      company_id: 62,
      staff_id: 158,
    });
  });
});
