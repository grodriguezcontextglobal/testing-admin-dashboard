import { useQuery } from "@tanstack/react-query";
import { devitrakApiPlatform } from "../../api/devitrakApi";
import {
  buildCompaniesQuery,
  normalizeCompaniesResponse,
} from "../../pages/platform/utils/platformClients";

/**
 * Every client company, for the Admin Console client list:
 * GET /api/platform/companies?search&status&page&limit
 * (reports/FRONTEND_admin_console_plan_2026-11-11.md, B3 and F4).
 *
 * `rows` is always an array, so the table has something to render while the
 * request is in flight.
 */
export const usePlatformCompanies = (filters = {}, { enabled = true } = {}) => {
  const params = buildCompaniesQuery(filters);
  const query = useQuery({
    queryKey: ["platform", "companies", params],
    queryFn: () => devitrakApiPlatform.get("/companies", { params }),
    enabled,
    placeholderData: (previous) => previous,
  });
  return { ...query, ...normalizeCompaniesResponse(query.data?.data) };
};

export default usePlatformCompanies;
