import { useQuery } from "@tanstack/react-query";
import { devitrakApiPlatform } from "../../api/devitrakApi";
import { normalizeSectionResponse } from "../../pages/platform/utils/clientProfile";

/**
 * A cross-client console list: GET /api/platform/<resource>?<query>
 * (inventory, transactions, events, people, audit, activity, attention; plan B3).
 * `rows` is always an array and `totals` an object or null.
 */
export const usePlatformList = (resource, query = {}, { enabled = true } = {}) => {
  const result = useQuery({
    queryKey: ["platform", resource, query],
    queryFn: () => devitrakApiPlatform.get(`/${resource}`, { params: query }),
    enabled: enabled && Boolean(resource),
    placeholderData: (previous) => previous,
  });
  return { ...result, ...normalizeSectionResponse(result.data?.data) };
};

/** Overview numbers for a range: GET /api/platform/summary?range=7d|30d|90d. */
export const usePlatformSummary = (range) => {
  const result = useQuery({
    queryKey: ["platform", "summary", range],
    queryFn: () => devitrakApiPlatform.get("/summary", { params: { range } }),
    placeholderData: (previous) => previous,
  });
  const data = result.data?.data?.data;
  return { ...result, summary: data && typeof data === "object" ? data : null };
};
