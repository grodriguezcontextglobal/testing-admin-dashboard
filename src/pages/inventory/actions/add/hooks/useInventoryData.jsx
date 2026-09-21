import { useQuery } from "@tanstack/react-query";
import { itemOptionsFrom } from "../../utils/referenceLookup";
import { devitrakApi } from "../../../../../api/devitrakApi";

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

  /* `narrowBy` is what makes the copy-details filters cascade: the panel asks
     for one field's options given what the other two are set to. */
  const retrieveItemOptions = (field, narrowBy) =>
    itemOptionsFrom(itemsInInventoryQuery.data?.data?.items, field, narrowBy);

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
