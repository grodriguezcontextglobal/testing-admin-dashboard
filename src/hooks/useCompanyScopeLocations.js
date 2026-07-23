import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { devitrakApi } from "../api/devitrakApi";

/**
 * Company locations for the scope-assignment UI (location-scoped roles). Backed
 * by `POST /db_company/locations { company_id }`, which returns
 * `{ ok, result: [{ location_id, location_name, ... }] }` — the parallel of the
 * categories endpoint (FRONTEND_INTEGRATION_scoped_roles.md §6). Options carry
 * the numeric `location_id` as value (that id is what the scope endpoint §4
 * expects) and `location_name` as label.
 *
 * This is a dedicated read-only id source for scope assignment; it does NOT
 * replace the legacy `preference.managerLocation` flows (R3 reconciliation is a
 * separate task).
 */
export const useCompanyScopeLocations = () => {
  // /db_company/* are SQL routes — they expect the SQL integer company id
  // (user.sqlInfo.company_id), NOT the Mongo companyData.id. Sending the Mongo
  // ObjectId returns an empty result. Mirrors the scope-save path in
  // UpdateRoleInCompany.jsx, which also uses user.sqlInfo.company_id.
  const companyId = useSelector((state) => state.admin.user?.sqlInfo?.company_id);

  const query = useQuery({
    queryKey: ["companyScopeLocations", companyId],
    queryFn: () =>
      devitrakApi.post("/db_company/locations", { company_id: companyId }),
    enabled: !!companyId,
  });

  const locations = Array.isArray(query.data?.data?.result)
    ? query.data.data.result
    : [];
  const options = locations
    .filter((location) => location?.location_id != null)
    .map((location) => ({
      label: location.location_name,
      value: location.location_id,
    }));

  return { ...query, locations, options };
};

export default useCompanyScopeLocations;
