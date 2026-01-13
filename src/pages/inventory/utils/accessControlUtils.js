/**
 * Utility functions for role-based and preference-based access control in Inventory.
 */

/**
 * Checks if the user has admin privileges (Role "0").
 * @param {string|number} role - The user's role.
 * @returns {boolean} - True if admin (role "0"), false otherwise.
 */
export const checkRolePermission = (role) => {
  return String(role) === "0";
};

/**
 * Retrieves the user's preferred locations from their profile.
 * @param {Object} user - The user object from Redux state.
 * @returns {Array} - Array of preferred locations (IDs or names).
 */
export const getPreferenceLocation = (user) => {
  if (!user?.companyData?.employees) return [];

  // Find the employee record for the current user
  const employeeRecord = user.companyData.employees.find(
    (element) => element.user === user.email
  );

  // New logic: Check for managerLocation in preference
  if (
    employeeRecord?.preference?.managerLocation &&
    Array.isArray(employeeRecord.preference.managerLocation)
  ) {
    return employeeRecord.preference.managerLocation.map((loc) => loc.location);
  }

  // Fallback to legacy preference structure or user root preference
  // If preference is just an array of strings (legacy)
  if (Array.isArray(employeeRecord?.preference)) {
    return employeeRecord.preference;
  }

  return user.preference || [];
};

/**
 * Filters data based on role and preferences.
 *
 * Logic:
 * 1. If Role is "0", return all data (where company_id matches, assumed implicit in data).
 * 2. If Role is NOT "0", filter by preference location.
 *
 * @param {Array} data - The dataset to filter.
 * @param {Object} user - The user object.
 * @returns {Array} - The filtered dataset.
 */
export const filterDataByRoleAndPreference = (data, user) => {
  if (!Array.isArray(data)) return [];

  // 1. Role-based access: Role "0" sees all
  if (checkRolePermission(user.role)) {
    return data;
  }

  // 2. Restricted access: Check preferences
  const preferences = getPreferenceLocation(user);

  if (!preferences || preferences?.length === 0) {
    console.warn(
      "Restricted user has no location preferences set. Access denied to all items."
    );
    return [];
  }

  // Filter logic
  return data?.filter((item) => {
    // Check company_id matches current user's company
    // Note: We perform a safe check. If item.company_id is missing, we assume it's valid if it came from the company-scoped API.
    // But if it is present, it MUST match.
    if (
      item.company_id &&
      String(item.company_id) !== String(user.sqlInfo.company_id)
    ) {
      return false;
    }

    // Check location match
    // We check against 'location' (name) or 'location_id' if available.
    // Preferences might be names or IDs. We'll try to match both for robustness.

    const itemLocationName = item.location;
    const itemLocationId = item.location_id;

    return preferences?.some((pref) => {
      // Check if pref matches ID (if both are present)
      if (itemLocationId && String(pref) === String(itemLocationId))
        return true;

      // Check if pref matches Name (exact or hierarchy start)
      if (itemLocationName) {
        if (String(itemLocationName) === String(pref)) return true;
        if (String(itemLocationName).startsWith(`${pref} /`)) return true;
      }

      return false;
    });
  });
};
