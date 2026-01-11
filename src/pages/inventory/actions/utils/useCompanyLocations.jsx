import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";

/**
 * Custom hook to fetch company locations hierarchy.
 * Uses the /location/companies/:id/locations endpoint.
 *
 * @returns {Object} query result containing data, isLoading, isError, etc.
 */
const useCompanyLocations = () => {
  const { user } = useSelector((state) => state.admin);
  const companyId = user?.sqlInfo?.company_id;

  const query = useQuery({
    queryKey: ["companyLocationsList", companyId],
    queryFn: async () => {
      const response = await devitrakApi.post(
        `/db_location/companies/${companyId}/locations`,
        {
          role: user.companyData.employees.find(
            (emp) => emp.user === user?.email
          )?.role,
          preference:
            user.companyData.employees.find((emp) => emp.user === user?.email)
              ?.preference || [],
        }
      );
      return response.data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => {
      if (data?.data) {
        // Flatten the recursive structure into a list of locations
        // The API returns an object where keys are location names and values contain metadata + children
        // { "LocationA": { children: { "SubLocationB": ... } }, "LocationC": ... }

        const flattenedLocations = [];

        // Helper function to process the nested structure
        // path: keeps track of hierarchy if needed (e.g., "Main / Sub")
        const processLocations = (
          locationsMap,
          parentId = null,
          hierarchyPath = []
        ) => {
          if (!locationsMap) return;

          Object.entries(locationsMap).forEach(([name, details]) => {
            const currentPath = [...hierarchyPath, name];

            // Create a standardized location object
            const locationObj = {
              location: name,
              location_name: name,
              // If details has metadata, map it here. Based on sample: total, available, types.
              total: details.total,
              available: details.available,
              types: details.types,
              id: name, // Fallback ID since sample doesn't show one
              _id: name,
              key: name,
              parentId: parentId, // Track parent location for hierarchy
              rootParent: currentPath[0], // Track the top-level parent
              hierarchyPath: currentPath, // Full path to this location
              // Mark as having children for UI logic if needed
              hasChildren:
                details.children !== null &&
                Object.keys(details.children || {}).length > 0,
              children: details.children,
            };

            flattenedLocations.push(locationObj);

            // Recursively process children
            if (details.children) {
              processLocations(details.children, name, currentPath);
            }
          });
        };

        processLocations(data.data);

        return flattenedLocations;
      }

      // Fallback for legacy array format if API still returns it in some cases
      if (data?.locations && Array.isArray(data.locations)) {
        return data.locations
          .map((loc) => ({
            ...loc,
            location: loc.location_name ?? loc.location ?? "",
            id: loc.location_id ?? loc.id ?? loc._id,
            _id: loc.location_id ?? loc._id,
            key: loc.location_id ?? loc.id ?? loc._id,
            created_at: loc.created_at
              ? new Date(loc.created_at).toISOString()
              : null,
            updated_at: loc.updated_at
              ? new Date(loc.updated_at).toISOString()
              : null,
            manager_id: loc.manager_id ?? null,
            address_details: loc.address_details ?? null,
          }))
          .sort((a, b) => String(a.location).localeCompare(String(b.location)));
      }
      return [];
    },
  });

  // Prevent infinite loading state if user is loaded but companyId is missing
  if (user && !companyId) {
    return { ...query, isLoading: false, data: [] };
  }

  return query;
};

export default useCompanyLocations;
