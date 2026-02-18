import { useQuery } from "@tanstack/react-query";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { groupBy } from "lodash";

const useInventoryData = (user) => {
  const itemsInInventoryQuery = useQuery({
    queryKey: ["ItemsInInventoryCheckingQuery"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
      }),
    refetchOnMount: false,
    enabled: !!user?.sqlInfo?.company_id,
  });

  const companyLocationsListQuery = useQuery({
    queryKey: ["companyLocationsListQuery", user.sqlInfo.company_id],
    queryFn: () =>
      devitrakApi.post(
        `/db_location/companies/${user.sqlInfo.company_id}/locations`,
        {
          company_id: user.sqlInfo.company_id,
          role: Number(
            user.companyData.employees.find((emp) => emp.user === user.email)
              .role
          ),
          preference:
            user.companyData.employees.find((emp) => emp.user === user.email)
              .preference || [],
        }
      ),
    enabled: !!user?.sqlInfo?.company_id && !!user?.email,
  });

  const retrieveItemOptions = (props) => {
    const result = new Set();
    if (itemsInInventoryQuery.data) {
      const itemsOptions = itemsInInventoryQuery.data.data.items;
      const groupingBy = groupBy(itemsOptions, `${props}`);
      for (let data of Object.keys(groupingBy)) {
        result.add(data);
      }
    }
    return Array.from(result);
  };

  const renderLocationOptions = () => {
    if (!companyLocationsListQuery?.data?.data?.data) {
      return [];
    }

    if (itemsInInventoryQuery.data) {
      const locations = companyLocationsListQuery?.data?.data?.data;
      const result = new Set();
      for (let data of Object.keys(locations)) {
        result.add({ value: data });
      }
      return Array.from(result);
    }
    return [];
  };

  const retrieveItemDataSelected = () => {
    const result = new Map();
    if (itemsInInventoryQuery.data) {
      const industryData = itemsInInventoryQuery?.data?.data?.items || [];
      for (let data of industryData) {
        result.set(data.item_group, data);
      }
    }
    return result;
  };

  return {
    itemsInInventoryQuery,
    companyLocationsListQuery,
    retrieveItemOptions,
    renderLocationOptions,
    retrieveItemDataSelected,
  };
};

export default useInventoryData;
