import { getRoleScopeDimension } from "../../../config/roles";

const FULL_ACCESS_TYPES = ["root_admin", "admin", "sale_manager"];
const INVENTORY_TYPES = [...FULL_ACCESS_TYPES, "inventory_manager"];

/**
 * Returns true if the roleType has unrestricted access to all inventory data.
 *
 * For inventory_manager the access is "general" (unrestricted) when no
 * locations have been assigned to them. Once locations are assigned they
 * become location-scoped and this returns false so filterDataByRoleAndPreference
 * can apply the location filter.
 *
 * @param {string} roleType
 * @param {Array}  [assignedLocations] - list of location names assigned to the user
 */
export const checkRolePermission = (roleType, assignedLocations) => {
  if (FULL_ACCESS_TYPES.includes(roleType)) return true;
  if (roleType === "inventory_manager") {
    return !assignedLocations || assignedLocations.length === 0;
  }
  return false;
};

/**
 * Retrieves the user's assigned locations from their employee record.
 *
 * @param {Object} user - Redux admin state user object
 * @returns {string[]} - Array of location names
 */
export const getPreferenceLocation = (user) => {
  if (!user?.companyData?.employees) return [];

  const employeeRecord = user.companyData.employees.find(
    (element) => element.user === user.email
  );

  if (
    employeeRecord?.preference?.managerLocation &&
    Array.isArray(employeeRecord.preference.managerLocation)
  ) {
    return employeeRecord.preference.managerLocation.map((loc) => loc.location);
  }

  if (Array.isArray(employeeRecord?.preference)) {
    return employeeRecord.preference;
  }

  return user.preference || [];
};

/**
 * Filters inventory/location data based on the user's roleType and assigned locations.
 *
 * Rules:
 * - root_admin / admin / sale_manager         → all data
 * - inventory_manager (no locations assigned) → all data (general access)
 * - inventory_manager (locations assigned)    → only items matching those locations
 * - event_manager / assistant                 → no access (empty array)
 *
 * @param {Array}  data - Dataset to filter
 * @param {Object} user - Redux admin state user object
 * @returns {Array}
 */
export const filterDataByRoleAndPreference = (data, user) => {
  if (!Array.isArray(data)) return [];

  if (!INVENTORY_TYPES.includes(user.roleType)) return [];

  const assignedLocations = getPreferenceLocation(user);

  if (checkRolePermission(user.roleType, assignedLocations)) return data;

  if (assignedLocations.length === 0) return [];

  return data.filter((item) => {
    if (
      item.company_id &&
      String(item.company_id) !== String(user.sqlInfo?.company_id)
    ) {
      return false;
    }

    const itemLocationName = item.location;
    const itemLocationId = item.location_id;

    return assignedLocations.some((pref) => {
      if (itemLocationId && String(pref) === String(itemLocationId)) return true;
      if (itemLocationName) {
        if (String(itemLocationName) === String(pref)) return true;
        if (String(itemLocationName).startsWith(`${pref} /`)) return true;
      }
      return false;
    });
  });
};

// ─── Scoped roles (Phase C) ───────────────────────────────────────────────────
// Category scope is the new dimension (roles category_manager/category_assistant).
// Server-side enforcement is authoritative; the helpers below mirror it on the
// client for a consistent UX. Location scope keeps its legacy path above.

/**
 * True when the role is category-scoped (category_manager / category_assistant).
 * @param {string} roleType
 * @returns {boolean}
 */
export const isCategoryScopedRole = (roleType) =>
  getRoleScopeDimension(roleType) === "category";

/**
 * Client-side mirror of the server's category-scope filter: keep only inventory
 * rows whose `category_name` is in the assigned set (matched case-insensitively,
 * since scope is by category name server-side).
 *
 * FAIL-CLOSED: an empty assignment set returns no inventory (matches the
 * backend contract — a scoped user with zero categories sees nothing).
 *
 * @param {Array}    data                 - Inventory rows (each with `category_name`)
 * @param {string[]} assignedCategoryNames - Category names assigned to the user
 * @returns {Array}
 */
export const filterInventoryByCategoryScope = (data, assignedCategoryNames) => {
  if (!Array.isArray(data)) return [];
  if (!Array.isArray(assignedCategoryNames) || assignedCategoryNames.length === 0) {
    return [];
  }
  const allowed = new Set(
    assignedCategoryNames.map((name) => String(name).toLowerCase())
  );
  return data.filter(
    (item) =>
      item?.category_name &&
      allowed.has(String(item.category_name).toLowerCase())
  );
};

/**
 * R6 — a CATEGORY-scoped role with zero assigned categories can see no
 * inventory; callers render the empty-scope message instead of an ambiguous
 * empty table.
 *
 * ⚠️ Only the CATEGORY dimension is evaluated here. Category scope is tracked
 * client-side in the SQL permission slice (`permission.categories`), so an
 * empty array reliably means "no scope". LOCATION scope, by the R3 decision,
 * still lives in the legacy Mongo `preference.managerLocation` and is enforced
 * server-side — it is NOT mirrored into the permission slice, so inferring
 * "empty" for a location role from `permission.locations` is wrong and would
 * hide the inventory table for a correctly-scoped location user. Location roles
 * therefore always return false here (server-side filtering governs what they
 * see).
 *
 * Non-scoped roles always return false.
 *
 * @param {string} roleType
 * @param {{ categories?: Array }} scope - permission-slice scope
 * @returns {boolean}
 */
export const hasEmptyScope = (roleType, { categories = [] } = {}) => {
  if (getRoleScopeDimension(roleType) !== "category") return false;
  return (categories?.length ?? 0) === 0;
};
