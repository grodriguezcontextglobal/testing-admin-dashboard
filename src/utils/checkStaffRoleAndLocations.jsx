import { useMemo } from "react";
import { useSelector } from "react-redux";
import { deriveRoleType } from "../pages/authentication/utils/loginUtils";

// Roles with full inventory access regardless of location assignments.
// Mirrors the SQL company_staff table: roles 0 (root_admin), 1 (admin), 3 (event_manager), 4 (inventory_manager).
const FULL_INVENTORY_ACCESS_ROLES = new Set([
  "root_admin",
  "admin",
  "event_manager",
  "inventory_manager",
]);

/**
 * A hook to process the current user's role and location-based permissions.
 * It centralizes the logic for checking employee data from Redux state,
 * handling error cases, and providing a clear and optimized API for components.
 *
 * @returns {object} An object containing user's role, permissions, and employee data.
 *  - `role` {string}: The user's role (e.g., "0", "2"). Defaults to "2".
 *  - `isAdmin` {boolean}: True if the user has admin privileges (role "0" or super_user).
 *  - `employee` {object|null}: The full employee record from the company data.
 *  - `permissionsByLocation` {object}: An object mapping locations to their specific action permissions.
 *  - `locationsViewPermission` {string[]}: Locations with 'view' permission (for backward compatibility).
 *  - `locationsAssignPermission` {string[]}: Locations with 'assign' permission (for backward compatibility).
 *  - `locationsCreatePermission` {string[]}: Locations with 'create' permission (for backward compatibility).
 *  - `locationsDeletePermission` {string[]}: Locations with 'delete' permission (for backward compatibility).
 *  - `locationsUpdatePermission` {string[]}: Locations with 'update' permission (for backward compatibility).
 *  - `transferPermission` {string[]}: Locations with 'transfer'permission (for backward compatibility).
 */
export const useStaffRoleAndLocations = () => {
  const { user } = useSelector((state) => state.admin);

  return useMemo(() => {
    // Define a default state for non-existent or invalid user/employee data
    const defaultState = {
      role: "2",
      isAdmin: false,
      employee: null,
      permissionsByLocation: {},
      locationsViewPermission: [],
      locationsAssignPermission: [],
      locationsCreatePermission: [],
      locationsDeletePermission: [],
      locationsUpdatePermission: [],
      transferPermission: [],
    };

    // Guard against missing user or employee data
    if (!user?.email || !Array.isArray(user?.companyData?.employees)) {
      return defaultState;
    }

    // Find the specific record for the logged-in user
    const employeeRecord = user.companyData.employees.find(
      (emp) => emp.user === user.email
    );

    if (!employeeRecord) {
      return defaultState;
    }

    const { role = "2", super_user = false, preference } = employeeRecord;
    const roleType = deriveRoleType(employeeRecord);
    const isAdmin = FULL_INVENTORY_ACCESS_ROLES.has(roleType) || super_user === true;

    if (isAdmin) {
      return {
        ...defaultState,
        role,
        roleType,
        isAdmin: true,
        employee: employeeRecord,
      };
    }

    // For non-admin users, parse their specific permissions from managerLocation
    const managerLocations = preference?.managerLocation || [];
    const permissionsByLocation = {};
    const locationPermissions = {
      view: [],
      assign: [],
      create: [],
      delete: [],
      update: [],
      transfer: [],
    };

    for (const loc of managerLocations) {
      if (loc.location && loc.actions) {
        // Create a structured map of locations to their actions
        permissionsByLocation[loc.location] = loc.actions;

        // Populate the permission arrays for backward compatibility
        for (const action in locationPermissions) {
          if (loc.actions[action] === true) {
            locationPermissions[action].push(loc.location);
          }
        }
      }
    }

    // Backward-compat fallback: records saved before view defaulted to true
    // will have view:false, leaving locationsViewPermission empty. If the user
    // has assigned locations but none have view:true, grant view to all of them.
    if (locationPermissions.view.length === 0 && managerLocations.length > 0) {
      locationPermissions.view = managerLocations
        .filter((loc) => loc.location)
        .map((loc) => loc.location);
    }

    return {
      role,
      roleType,
      isAdmin: false,
      employee: employeeRecord,
      permissionsByLocation,
      locationsViewPermission: locationPermissions.view,
      locationsAssignPermission: locationPermissions.assign,
      locationsCreatePermission: locationPermissions.create,
      locationsDeletePermission: locationPermissions.delete,
      locationsUpdatePermission: locationPermissions.update,
      transferPermission: locationPermissions.transfer,
    };
  }, [user]);
};
