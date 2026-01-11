import { useMemo } from "react";
import useCompanyLocations from "./useCompanyLocations";

/**
 * Custom hook to fetch sub-locations for a specific location.
 * Now consumes the hierarchical data from useCompanyLocations instead of a separate API call.
 *
 * @param {string} locationId - The ID or Name of the parent location.
 * @returns {Object} query result containing data (sub-locations), isLoading, etc.
 */
const useSubLocations = (locationId) => {
  const {
    data: allLocations,
    isLoading,
    isError,
    error,
    refetch,
  } = useCompanyLocations();

  const subLocations = useMemo(() => {
    if (!allLocations || !locationId) return [];

    // Find the parent location object in the flattened list
    // Since we flattened it, we need to check if we can reconstruct the hierarchy or if we just search the children
    // property we preserved in useCompanyLocations.

    // Strategy:
    // 1. Find the parent location in the allLocations array.
    // 2. Access its 'children' property which contains the nested structure.
    // 3. Convert that children object into an array of sub-location names/objects.

    const parentLocation = allLocations.find(
      (loc) =>
        String(loc.id) === String(locationId) ||
        String(loc.location) === String(locationId)
    );

    if (parentLocation && parentLocation.children) {
      // children is an object: { "SubLocationName": { ...details }, ... }
      return Object.keys(parentLocation.children);
    }

    return [];
  }, [allLocations, locationId]);

  return {
    data: subLocations,
    isLoading,
    isError,
    error,
    refetch,
  };
};

export default useSubLocations;
