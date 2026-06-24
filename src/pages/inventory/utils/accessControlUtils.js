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
