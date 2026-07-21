import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { devitrakApi } from "../api/devitrakApi";
import { dedupeCategories } from "../pages/staff/detail/components/equipment_components/utils/scopeUtils";

/**
 * Company categories for the scope-assignment scaffold. Backed by the LIVE
 * `POST /db_company/categories { company_id }` endpoint, which returns
 * `{ ok, result: [{ category_id, category_name, ... }] }`
 * (FRONTEND_INTEGRATION_scoped_roles.md §6). Options are deduped by
 * category_name (backend §5.5) via dedupeCategories and carry the numeric
 * `category_id` as value — that id is what the scope endpoint (§4) expects.
 */
export const useCompanyCategories = () => {
  const companyId = useSelector((state) => state.admin.user?.companyData?.id);

  const query = useQuery({
    queryKey: ["companyCategories", companyId],
    queryFn: () =>
      devitrakApi.post("/db_company/categories", { company_id: companyId }),
    enabled: !!companyId,
  });

  const categories = dedupeCategories(query.data?.data?.result);
  const options = categories.map((category) => ({
    label: category.category_name,
    value: category.category_id,
  }));

  return { ...query, categories, options };
};

export default useCompanyCategories;
