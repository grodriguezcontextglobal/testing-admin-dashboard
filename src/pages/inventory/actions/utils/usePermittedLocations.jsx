
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useCompanyLocations from './useCompanyLocations';
import { verifyLocationSetupConditions } from './permissionUtils';

/**
 * Custom hook to fetch and filter locations based on user permissions.
 *
 * @param {string} action - The action to check permissions for ('create' or 'update').
 * @returns {Object} - {
 *   data: Array<string>, // Filtered list of permitted locations
 *   isLoading: boolean,
 *   isError: boolean,
 *   isAllowed: boolean, // Whether the user has permission to perform the action at all
 *   permittedLocations: Array<string>|null // The raw permission list (null means all)
 * }
 */
const usePermittedLocations = (action) => {
  const { user } = useSelector((state) => state.admin);
  const { data: allLocations, isLoading, isError } = useCompanyLocations();

  const { isAllowed, permittedLocations } = useMemo(() => {
    return verifyLocationSetupConditions(user, action);
  }, [user, action]);

  const filteredLocations = useMemo(() => {
    if (!allLocations) return [];
    if (!isAllowed) return [];
    
    // If permittedLocations is null, it means ALL locations are allowed (Admin/Owner)
    if (permittedLocations === null) {
      return allLocations;
    }

    // Otherwise, filter the locations
    return allLocations.filter(location => 
      permittedLocations.some(allowed => 
        String(location).toLowerCase().includes(String(allowed).toLowerCase())
      )
    );
  }, [allLocations, isAllowed, permittedLocations]);

  return {
    data: filteredLocations,
    isLoading,
    isError,
    isAllowed,
    permittedLocations
  };
};

export default usePermittedLocations;
