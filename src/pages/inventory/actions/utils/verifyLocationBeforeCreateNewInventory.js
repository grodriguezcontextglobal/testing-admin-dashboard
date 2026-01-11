import { useQuery } from "@tanstack/react-query";
import { message } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";

/**
 * Fetches existing locations for a company from the API.
 * Uses queryClient to cache the result for 5 minutes.
 *
 * @param {string} companyId - The ID of the company.
 * @param {object} queryClient - The React Query client instance.
 * @returns {Promise<string[]>} A promise that resolves to an array of location names.
 */
export const fetchExistingLocations = async (companyId, queryClient) => {
  const queryKey = ["companyLocationsListQuery", companyId];
  const queryFn = () =>
    devitrakApi.post(`/db_location/companies/${companyId}/locations`, {
      company_id: companyId,
      role: 0,
      preference: [],
    });

  try {
    const response = await queryClient.fetchQuery({
      queryKey,
      queryFn,
      staleTime: 1000 * 60 * 5,
    });

    if (response?.data?.data) {
      const locationsData = response.data.data;
      if (Array.isArray(locationsData)) {
        return locationsData.map((l) => l.location);
      } else if (typeof locationsData === "object") {
        return Array.from(Object.keys(locationsData));
      }
    }
    return [];
  } catch (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
};

export const verifyAndCreateLocation = async ({
  locationName,
  companyId,
  queryClient,
}) => {
  if (!locationName || !companyId) return false;

  try {
    const existingLocations = await fetchExistingLocations(
      companyId,
      queryClient
    );

    const exists = existingLocations.some(
      (loc) => loc.trim().toLowerCase() === locationName.trim().toLowerCase()
    );

    if (exists) {
      return true;
    }

    await devitrakApi.post("/db_location/locations", {
      company_id: companyId,
      location_name: locationName,
      manager_id: null,
      address_details: "",
    });

    message.success(`Location "${locationName}" created successfully.`);

    if (queryClient) {
      await queryClient.invalidateQueries({
        queryKey: ["ItemsInInventoryCheckingQuery"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["companyHasInventoryQuery"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["companyLocationsListQuery", companyId],
      });
    }

    return true;
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    message.error(`Error verifying/creating location: ${errorMsg}`);
    throw error;
  }
};

const useVerifyLocationBeforeCreateNewInventory = () => {
  const [list, setList] = useState([]);
  const { user } = useSelector((state) => state.admin);
  const companyLocationsListQuery = useQuery({
    queryKey: ["companyLocationsListQuery", user.sqlInfo.company_id],
    queryFn: () =>
      devitrakApi.post(
        `/db_location/companies/${user.sqlInfo.company_id}/locations`,
        {
          company_id: user.sqlInfo.company_id,
          role: 0,
          preference: [],
        }
      ),
    enabled: !!user.sqlInfo.company_id && !!user.email,
  });
  useEffect(() => {
    if (companyLocationsListQuery.data) {
      setList(
        Array.from(Object.keys(companyLocationsListQuery?.data?.data?.data))
      );
    }
  }, [companyLocationsListQuery.data]);

  return list;
};

export default useVerifyLocationBeforeCreateNewInventory;
