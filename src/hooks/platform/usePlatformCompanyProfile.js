import { useQuery } from "@tanstack/react-query";
import { devitrakApiPlatform } from "../../api/devitrakApi";
import {
  buildSectionQuery,
  normalizeSectionResponse,
} from "../../pages/platform/utils/clientProfile";

const companyPath = (companyId) => `/companies/${encodeURIComponent(companyId)}`;

/**
 * One client company for the profile header and Overview tab:
 * GET /api/platform/companies/:id (plan B3).
 */
export const usePlatformCompany = (companyId) => {
  const query = useQuery({
    queryKey: ["platform", "company", companyId],
    queryFn: () => devitrakApiPlatform.get(companyPath(companyId)),
    enabled: Boolean(companyId),
  });
  const data = query.data?.data?.data;
  return { ...query, company: data && typeof data === "object" ? data : null };
};

/**
 * One profile tab: GET /api/platform/companies/:id/<resource>. Each tab asks
 * only when it is open, so the profile does not fire ten requests at once.
 */
export const usePlatformCompanySection = (companyId, resource, filters = {}) => {
  const params = buildSectionQuery(filters);
  const query = useQuery({
    queryKey: ["platform", "company-section", companyId, resource, params],
    queryFn: () => devitrakApiPlatform.get(`${companyPath(companyId)}/${resource}`, { params }),
    enabled: Boolean(companyId && resource),
    placeholderData: (previous) => previous,
  });
  return { ...query, ...normalizeSectionResponse(query.data?.data) };
};
