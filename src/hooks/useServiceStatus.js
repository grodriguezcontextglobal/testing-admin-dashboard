import { useQuery } from "@tanstack/react-query";

/**
 * The public service-status document, read straight from the browser.
 *
 * Contract: FRONTEND_status_page_integration.md. Three of its rules are load
 * bearing and are enforced here rather than left to whoever renders this:
 *
 * ## It is a plain `fetch`, on purpose
 *
 * `CLAUDE.md` says to import API clients from `src/api/devitrakApi.jsx` and
 * never to build one ad hoc. **This is the documented exception.** That
 * client's request interceptor attaches `x-token` and `s-token-lq` from
 * localStorage to every request it makes, with no check on the origin, so
 * pointing it at the status worker would hand our session tokens to a third
 * party. `credentials: "omit"` says the same thing to the browser.
 *
 * ## A failure is `unknown`, never `operational`
 *
 * The worker lives outside our infrastructure so it keeps answering on the day
 * we do not. If we cannot reach it, what we know is nothing — and a status page
 * that paints green when it cannot reach the service is worse than no status
 * page. The same goes for a body that is not the document we were promised.
 *
 * Note this cuts the other way too: our own network is the likeliest reason a
 * request from this browser failed. That is why `unreachable` is reported
 * separately, so the screen can say "we could not reach the status service"
 * instead of claiming the service is down.
 *
 * ## One request a minute
 *
 * The worker recomputes once a minute and caches for thirty seconds, so polling
 * harder returns the same bytes. `new QueryClient()` in `main.jsx` carries
 * react-query's defaults — `staleTime: 0` and `refetchOnWindowFocus: true` —
 * which on a dashboard people leave open in a background tab is many requests a
 * minute, not one. Both are overridden below; neither is decoration.
 */

export const STATUS_ENDPOINT =
  "https://devitrak-status.cacaminero.workers.dev/api/status.json";

/** Where a reader goes for the detail and the history we do not embed. */
export const STATUS_PAGE_URL = "https://devitrak-status.cacaminero.workers.dev";

export const STATUS_POLL_MS = 60_000;

/** The four the contract defines. Anything else resolves to `unknown`. */
export const STATUS_VALUES = ["operational", "degraded", "down", "unknown"];

const asStatus = (value) =>
  STATUS_VALUES.includes(value) ? value : "unknown";

/* Components are carried through as they arrive, including keys published
   after this was written: the contract says the list will grow and that a new
   component must not need a release from us. Only `status` is normalised, so
   an unfamiliar value cannot render as green. */
const asComponent = (raw) => ({
  key: String(raw?.key ?? ""),
  name: raw?.name ?? raw?.key ?? "",
  description: raw?.description ?? "",
  status: asStatus(raw?.status),
  since: raw?.since ?? null,
  uptime90d: typeof raw?.uptime90d === "number" ? raw.uptime90d : null,
});

const UNKNOWN = {
  overall: "unknown",
  components: [],
  incident: null,
  generatedAt: null,
};

const parse = (body) => {
  // The document always carries a components array. Anything else is a
  // response we do not understand, which is not the same as good news.
  if (!body || !Array.isArray(body.components)) return UNKNOWN;
  return {
    overall: asStatus(body.overall),
    components: body.components.map(asComponent),
    incident: body.incident ?? null,
    generatedAt: body.generatedAt ?? null,
  };
};

async function fetchServiceStatus() {
  const response = await fetch(STATUS_ENDPOINT, {
    method: "GET",
    // No headers of ours, and no cookies: this origin is not ours.
    credentials: "omit",
  });
  if (!response.ok) throw new Error(`Status endpoint returned ${response.status}`);
  return parse(await response.json());
}

export function useServiceStatus() {
  const query = useQuery({
    queryKey: ["service-status"],
    queryFn: fetchServiceStatus,
    staleTime: STATUS_POLL_MS,
    refetchInterval: STATUS_POLL_MS,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const data = query.data ?? UNKNOWN;

  return {
    ...data,
    isLoading: query.isLoading,
    /* True when the last attempt did not reach the worker. Distinct from
       `overall === "unknown"`, which the worker can also report by itself. */
    unreachable: query.isError,
    updatedAt: data.generatedAt,
  };
}
