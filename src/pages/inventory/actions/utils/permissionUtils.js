/**
 * permissionUtils.js
 * Centralized permission validation for inventory operations.
 */

/**
 * @typedef {Object} PermissionObject
 * @property {boolean} hasFullAccess - True if user has Role 0 (Admin/Owner).
 * @property {string[]|null} permittedLocations - Array of location names the user has access to, or null for full access.
 * @property {string|null} managerLocation - The specific location assigned to manager (if applicable).
 * @property {string} [error] - Error message if validation fails.
 */

/**
 * Retrieves the comprehensive permission object for a user.
 * @param {Object} user - The user object.
 * @param {Object} [companyData] - Optional company data (defaults to user.companyData).
 * @returns {PermissionObject}
 */
export const getUserPermissions = (user, companyData) => {
  const targetCompanyData = companyData || user?.companyData;

  if (!user || !user.email || !targetCompanyData) {
    return {
      hasFullAccess: false,
      permittedLocations: [],
      managerLocation: null,
      error: "Invalid user or company data",
    };
  }

  const employee = targetCompanyData.employees?.find(
    (emp) => emp.user === user.email
  );

  if (!employee) {
    return {
      hasFullAccess: false,
      permittedLocations: [],
      managerLocation: null,
      error: "User not found in company employees",
    };
  }

  const role = employee.role;

  // Role 0: Admin/Owner - Full Access
  // SPECIAL PERMISSION CHECK: Bypasses all location-based restrictions
  // Returns permittedLocations as null to indicate "ALL" (no filtering required)
  if (role === 0 || role === "0") {
    return {
      hasFullAccess: true,
      permittedLocations: null, // null explicitly indicates unrestricted access
      managerLocation: null,
    };
  }

  // Role 1+: Restricted Access
  const preferences = employee.preference;
  if (!preferences || !preferences.managerLocation) {
    return {
      hasFullAccess: false,
      permittedLocations: [],
      managerLocation: null,
    };
  }

  // Extract location names
  const permittedLocations = preferences.managerLocation.map(
    (loc) => loc.location
  );

  return {
    hasFullAccess: false,
    permittedLocations,
    // Assuming the first location is the primary "managerLocation"
    managerLocation:
      permittedLocations.length > 0 ? permittedLocations[0] : null,
  };
};

/**
 * Checks if a user has permission for a specific action in a specific location.
 * @param {Object} user - The user object containing companyData and employees list.
 * @param {string} action - The action to check ('create', 'update', 'delete').
 * @param {string} location - The location to check permission for.
 * @returns {Object} - { allowed: boolean, reason: string }
 */
export const checkPermission = (user, action, location) => {
  const permissions = getUserPermissions(user);

  if (permissions.error) {
    return { allowed: false, reason: permissions.error };
  }

  if (permissions.hasFullAccess) {
    return { allowed: true, reason: "Admin access bypass." };
  }

  // Granular check for Role 1
  const employee = user.companyData.employees.find(
    (emp) => emp.user === user.email
  );

  if (!employee?.preference?.managerLocation) {
    return { allowed: false, reason: "No location permissions assigned." };
  }

  const locationPermission = employee.preference.managerLocation.find(
    (loc) => loc.location === location
  );

  if (!locationPermission) {
    return { allowed: false, reason: `No access to location: ${location}` };
  }

  if (locationPermission.actions && locationPermission.actions[action]) {
    return { allowed: true, reason: "Permission granted." };
  }

  const reason = `Permission '${action}' denied for location: ${location}`;
  console.warn(
    `[Permission Denied] User: ${user.email}, Role: ${employee.role}, ${reason}`
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
 * @returns {Array<string>|null} - Array of permitted location names or null for all.
 */
export const getPermittedLocations = (user, action) => {
  const permissions = getUserPermissions(user);

  if (permissions.error) return [];
  if (permissions.hasFullAccess) return null;

  const employee = user.companyData.employees.find(
    (emp) => emp.user === user.email
  );

  if (!employee?.preference?.managerLocation) return [];

  return employee.preference.managerLocation
    .filter((loc) => {
      if (!loc.actions) return false;
      if (Array.isArray(loc.actions)) {
        return loc.actions.includes(action);
      }
      return loc.actions[action];
    })
    .map((loc) => loc.location);
};

/**
 * Verifies if the conditions for location setup are met.
 * @param {Object} user - The user object.
 * @param {string} action - The action required.
 * @returns {Object} - { isAllowed: boolean, permittedLocations: Array<string>|null }
 */
export const verifyLocationSetupConditions = (user, action) => {
  const permittedLocations = getPermittedLocations(user, action);

  const isAllowed =
    permittedLocations === null || permittedLocations.length > 0;

  return {
    isAllowed,
    permittedLocations,
  };
};
