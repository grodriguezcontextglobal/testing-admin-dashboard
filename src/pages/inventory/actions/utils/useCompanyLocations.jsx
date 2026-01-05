import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";

/**
 * Custom hook to fetch company locations hierarchy.
 * Uses the /db_company/get-location-item-types-hierarchy endpoint.
 *
 * @returns {Object} query result containing data, isLoading, isError, etc.
 */
const useCompanyLocations = () => {
  const { user } = useSelector((state) => state.admin);

  return useQuery({
    queryKey: ["locationsAndSublocationsWithTypes", user?.sqlInfo?.company_id],
    queryFn: async () => {
      const response = await devitrakApi.post(
        "/db_company/get-location-item-types-hierarchy",
        {
          company_id: user.sqlInfo.company_id,
          role: user.companyData.employees.find(
            (element) => element.user === user.email
          )?.role,
          preference:
            user.companyData.employees.find(
              (element) => element.user === user.email
            )?.preference || [],
        }
      );
      return response.data;
    },
    enabled: !!user?.sqlInfo?.company_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => {
      if (data?.ok && data?.data) {
        return Object.keys(data.data);
      }
      return [];
    },
  });
};

export default useCompanyLocations;
