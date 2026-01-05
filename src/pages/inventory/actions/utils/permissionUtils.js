/**
 * permissionUtils.js
 * Centralized permission validation for inventory operations.
 */

/**
 * Checks if a user has permission for a specific action in a specific location.
 * @param {Object} user - The user object containing companyData and employees list.
 * @param {string} action - The action to check ('create', 'update', 'delete').
 * @param {string} location - The location to check permission for.
 * @returns {Object} - { allowed: boolean, reason: string }
 */
export const checkPermission = (user, action, location) => {
  if (!user || !user.email || !user.companyData) {
    return { allowed: false, reason: "Invalid user data." };
  }

  // Role 0 Bypass: Admin/Owner has full access
  if (user.role === 0 || user.role === "0") {
    return { allowed: true, reason: "Admin access bypass." };
  }

  const employee = user.companyData.employees.find(
    (emp) => emp.user === user.email
  );
  if (!employee) {
    return { allowed: false, reason: "User not found in company employees." };
  }

  const preferences = employee.preference;
  if (!preferences || !preferences.managerLocation) {
    return { allowed: false, reason: "No location permissions assigned." };
  }

  // Normalize location check (case-insensitive if needed, but assuming exact match for now)
  // Also handling potential sub-locations if passed as "Main / Sub" - usually permissions are on Main location
  // But based on previous context, we might match partially.
  // For now, strict matching against the list.
  const locationPermission = preferences.managerLocation.find(
    (loc) => loc.location === location
  );

  if (!locationPermission) {
    return { allowed: false, reason: `No access to location: ${location}` };
  }

  if (locationPermission.actions && locationPermission.actions[action]) {
    return { allowed: true, reason: "Permission granted." };
  }

  const reason = `Permission '${action}' denied for location: ${location}`;
  // Log permission denial for debugging/auditing
  console.warn(
    `[Permission Denied] User: ${user.email}, Role: ${user.role}, ${reason}`
  );

  return {
    allowed: false,
    reason,
  };
};

/**
 * Retrieves a list of locations where the user has the specified permission.
 * @param {Object} user - The user object.
 * @param {string} action - The action to filter by ('create', 'update', 'delete').
 * @returns {Array<string>} - Array of permitted location names.
 */
export const getPermittedLocations = (user, action) => {
  if (!user || !user.email || !user.companyData) return [];

  // Role 0 Bypass: Admin/Owner has access to ALL locations.
  // Returning null signifies "All Locations" to the consumer.
  if (user.role === 0 || user.role === "0") {
    return null;
  }

  const employee = user.companyData.employees.find(
    (emp) => emp.user === user.email
  );
  if (!employee || !employee.preference || !employee.preference.managerLocation)
    return [];

  return employee.preference.managerLocation
    .filter((loc) => loc.actions && loc.actions[action])
    .map((loc) => loc.location);
};

/**
 * Verifies if the conditions for location setup are met.
 * Conditions:
 * 1. A manager is properly assigned to the location.
 * 2. The location has actions configured and available.
 *
 * @param {Object} user - The user object.
 * @param {string} action - The action required ('create' or 'update').
 * @returns {Object} - { isAllowed: boolean, permittedLocations: Array<string>|null }
 */
export const verifyLocationSetupConditions = (user, action) => {
  const permittedLocations = getPermittedLocations(user, action);

  // If permittedLocations is null (Admin) or has entries (Role 1 with permissions),
  // then at least one location satisfies the conditions.
  const isAllowed =
    permittedLocations === null || permittedLocations.length > 0;

  return {
    isAllowed,
    permittedLocations,
  };
};
