import { useQuery } from "@tanstack/react-query";
import { devitrakApiPlatform } from "../../api/devitrakApi";
import { retryPlatformQuery } from "../../pages/platform/utils/platformQuery";

// Long enough that moving between console screens does not re-ask on every
// route change, short enough that a revocation is noticed within the minute
// an operator is reading one screen. Returning to the tab re-asks regardless,
// which is the case this is really for: a console left open.
const ME_STALE_MS = 60 * 1000;

/**
 * Who the server says this operator is, right now:
 * GET /api/platform/me -> { ok, data: { uid, email, platformAccess, domain,
 * platformObserver, mfaEnabled, checkedAt } }.
 *
 * The console gate reads `platformAccess` from here rather than from the
 * sign-in response, which is a copy that redux-persist keeps in localStorage
 * past the end of the tab (utils/platformGate.js has the reasoning).
 *
 * `body` is the response body. The verdict needs to tell a refusal apart from
 * a failure to ask, so the error is passed through untouched -- no normalizing
 * it into an empty object.
 */
export const usePlatformMe = ({ enabled = true } = {}) => {
  const query = useQuery({
    queryKey: ["platform", "me"],
    queryFn: () => devitrakApiPlatform.get("/me"),
    enabled,
    staleTime: ME_STALE_MS,
    refetchOnWindowFocus: true,
    retry: retryPlatformQuery,
  });
  return { ...query, body: query.data?.data };
};

export default usePlatformMe;
