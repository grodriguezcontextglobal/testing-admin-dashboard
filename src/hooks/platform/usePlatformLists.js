import { useQuery } from "@tanstack/react-query";
import { devitrakApiPlatform } from "../../api/devitrakApi";
import {
  normalizeSectionResponse,
  resourceDiscriminator,
} from "../../pages/platform/utils/clientProfile";
import { retryPlatformQuery } from "../../pages/platform/utils/platformQuery";

/**
 * A cross-client console list: GET /api/platform/<resource>?<query>
 * (inventory, transactions, events, audit, activity, attention; plan B3).
 * Not people: members and consumers are read per company, through
 * usePlatformClientSection, so every read of a person carries a company id.
 * `rows` is always an array and `totals` an object or null.
 *
 * The resource's own discriminator is added here rather than in
 * buildListQuery, because this is the one place every cross-client list read
 * passes through: a screen that builds its query by hand still gets it, and it
 * is last, so a caller cannot override it. Today that means `type=event` on
 * the events list (clientProfile.js, resourceDiscriminator).
 */
export const usePlatformList = (resource, query = {}, { enabled = true } = {}) => {
  const params = { ...query, ...resourceDiscriminator(resource) };
  const result = useQuery({
    queryKey: ["platform", resource, params],
    queryFn: () => devitrakApiPlatform.get(`/${resource}`, { params }),
    enabled: enabled && Boolean(resource),
    placeholderData: (previous) => previous,
    retry: retryPlatformQuery,
  });
  return { ...result, ...normalizeSectionResponse(result.data?.data) };
};

/** Overview numbers for a range: GET /api/platform/summary?range=7d|30d|90d. */
export const usePlatformSummary = (range) => {
  const result = useQuery({
    queryKey: ["platform", "summary", range],
    queryFn: () => devitrakApiPlatform.get("/summary", { params: { range } }),
    placeholderData: (previous) => previous,
    retry: retryPlatformQuery,
  });
  const data = result.data?.data?.data;
  return { ...result, summary: data && typeof data === "object" ? data : null };
};
