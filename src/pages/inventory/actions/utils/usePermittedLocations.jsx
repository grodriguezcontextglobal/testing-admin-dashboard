import { useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import useCompanyLocations from "./useCompanyLocations";
import { getUserPermissions, getPermittedLocations } from "./permissionUtils";

/**
 * Custom hook to fetch and filter locations based on user permissions.
 *
 * @param {string} [action] - Optional action to check permissions for (e.g., 'create', 'update').
 * @returns {Object} - {
 *   data: Array<Object>, // Filtered location objects (alias for compatibility)
 *   permittedLocations: Array<string>|null, // List of allowed location names (or null for full access)
 *   isAuthorized: boolean,
 *   currentLocation: string|null, // Manager's primary location name
 *   taxLocationOptions: Array<{value: string, label: string}>, // Options for tax location dropdown
 *   mainLocationOptions: Array<string>, // Options for main location dropdown (String[])
 *   getSubLocationOptions: (mainLocationName: string) => Array<string>, // Function to get sub-locations (String[])
 *   isLoading: boolean,
 *   isError: boolean,
 *   error: any
 * }
 */
const usePermittedLocations = (action) => {
  const { user } = useSelector((state) => state.admin);
  const {
    data: allLocations,
    isLoading,
    isError,
    error,
  } = useCompanyLocations();

  const permissions = useMemo(() => {
    return getUserPermissions(user, user?.companyData);
  }, [user]);

  // Determine permitted names based on action or general permissions
  const permittedNames = useMemo(() => {
    if (action) {
      return getPermittedLocations(user, action);
    }
    return permissions.hasFullAccess ? null : permissions.permittedLocations;
  }, [user, action, permissions]);

  const { managerLocation } = permissions;

  const filteredLocations = useMemo(() => {
    if (!allLocations) return [];

    // Role 0 or Full Access (permittedNames is null)
    if (permittedNames === null) {
      return allLocations;
    }

    // Role 1+: Filter based on permitted names
    if (permittedNames.length === 0) {
      return [];
    }

    // Filter logic: Case-insensitive match on location name
    return allLocations.filter((locObj) =>
      permittedNames.some(
        (allowedName) =>
          String(locObj.location).toLowerCase() ===
          String(allowedName).toLowerCase()
      )
    );
  }, [allLocations, permittedNames]);

  // Extract Tax Location Options (All permitted locations)
  const taxLocationOptions = useMemo(() => {
    return filteredLocations.map((loc) => ({
      value: loc.location,
      label: loc.location,
      key: loc.key || loc.id,
      ...loc,
    }));
  }, [filteredLocations]);

  // Extract Main Location Options (Permitted Top-Level Locations)
  // Returns String[] as requested
  const mainLocationOptions = useMemo(() => {
    return filteredLocations
      .filter((loc) => !loc.parentId) // Only top-level
      .map((loc) => loc.location); // Return just the string name
  }, [filteredLocations]);

  // Extract Sub-Location Options (Dynamic based on parent)
  // Returns String[] containing all nested location names
  const getSubLocationOptions = useCallback(
    (mainLocationName) => {
      if (!mainLocationName) return [];

      // Return all permitted descendants of the given main location (rootParent)
      // Excluding the main location itself
      return filteredLocations
        .filter(
          (loc) =>
            String(loc.rootParent).toLowerCase() ===
              String(mainLocationName).toLowerCase() &&
            String(loc.location).toLowerCase() !==
              String(mainLocationName).toLowerCase()
        )
        .map((loc) => loc.location); // Return just the string name
    },
    [filteredLocations]
  );

  return {
    isAllowed: permittedNames === null || permittedNames.length > 0,
    isAuthorized: permittedNames === null || permittedNames.length > 0, // Deprecated alias
    permittedLocations: permittedNames, // Return strings for backward compatibility/validation
    data: filteredLocations, // Return objects for UI rendering (e.g. dropdowns)
    currentLocation: managerLocation,
    taxLocationOptions,
    mainLocationOptions,
    getSubLocationOptions,
    isLoading,
    isError,
    error,
  };
};

export default usePermittedLocations;
