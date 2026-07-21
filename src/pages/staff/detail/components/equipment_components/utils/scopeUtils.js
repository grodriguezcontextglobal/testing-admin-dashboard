import { getRoleScopeDimension } from "../../../../../../config/roles";

/**
 * Dedupes a categories list by category_name (backend §5.5 — stale/duplicate
 * category lists across items), preserving the first category_id seen for
 * each name and the original ordering. Ignores entries without a
 * category_name. Returns [] for null/undefined/non-array input.
 */
export const dedupeCategories = (result) => {
  if (!Array.isArray(result)) return [];
  const seen = new Set();
  const deduped = [];
  for (const category of result) {
    const name = category?.category_name;
    if (!name || seen.has(name)) continue;
    seen.add(name);
    deduped.push(category);
  }
  return deduped;
};

const SCOPE_DIMENSION_LABELS = {
  location: "location",
  category: "category",
};

/**
 * Fail-closed guard (review R6): a scoped role saved with zero assignments
 * would leave the user unable to see any inventory. Non-scoped roleTypes are
 * always valid regardless of selection.
 */
export const validateScopeSelection = (roleType, selection) => {
  const dimension = getRoleScopeDimension(roleType);
  if (!dimension) return { valid: true, message: "" };

  const hasSelection = Array.isArray(selection) && selection.length > 0;
  if (hasSelection) return { valid: true, message: "" };

  const label = SCOPE_DIMENSION_LABELS[dimension] ?? dimension;
  return {
    valid: false,
    message: `Assign at least one ${label} — a scoped user with no assignments cannot see any inventory.`,
  };
};

/**
 * Builds the body for `PUT /db_staff/company-staff/scope`
 * (FRONTEND_INTEGRATION_scoped_roles.md §4). Sends ONLY the dimension that
 * matches the role — location role → `locations`, category role → `categories`
 * — because sending the wrong key is a 400. Ids are coerced to numbers and
 * non-numeric entries dropped (the endpoint requires numeric ids). A non-scoped
 * roleType yields no dimension key. Full-replace semantics: pass the complete
 * current selection, not a delta.
 */
export const buildScopePayload = (roleType, selection, { company_id, staff_id }) => {
  const base = { company_id, staff_id };
  const dimension = getRoleScopeDimension(roleType);
  if (!dimension) return base;

  const ids = (Array.isArray(selection) ? selection : [])
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

  return dimension === "location"
    ? { ...base, locations: ids }
    : { ...base, categories: ids };
};
