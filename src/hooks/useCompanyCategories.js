import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { devitrakApi } from "../api/devitrakApi";
import { dedupeCategories } from "../pages/staff/detail/components/equipment_components/utils/scopeUtils";

/**
 * Company categories for the scope-assignment scaffold (Phase A — see
 * FRONTEND_scoped_roles_phaseA_plan.md §4.1). Backed by the LIVE
 * `POST /db_company/categories { company_id }` endpoint. Options are deduped
 * by category_name (backend §5.5) via dedupeCategories.
 */
export const useCompanyCategories = () => {
  const companyId = useSelector((state) => state.admin.user?.companyData?.id);

  const query = useQuery({
    queryKey: ["companyCategories", companyId],
    queryFn: () =>
      devitrakApi.post("/db_company/categories", { company_id: companyId }),
    enabled: !!companyId,
  });

  const categories = dedupeCategories(query.data?.data?.categories);
  const options = categories.map((category) => ({
    label: category.category_name,
    value: category.category_name,
  }));

  return { ...query, categories, options };
};

export default useCompanyCategories;
