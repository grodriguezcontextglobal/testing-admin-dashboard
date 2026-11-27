// Shared React Query behaviour for the Admin Console. Pure: no React, no I/O.

// A timeout and a rate limit are the two client-side statuses where waiting
// and asking again is the right answer. The rest are the server saying no,
// and it will keep saying no.
const WORTH_RETRYING = new Set([408, 429]);

/**
 * 501 is a refusal wearing a 5xx. Every other 5xx is the server failing at
 * something it meant to do, which is worth asking again; 501 is the server
 * saying "this data is not mine to give", which will be just as true on the
 * third ask. The Merchant tab spent about eight seconds on a loading skeleton
 * to learn that (backend note, 2026-11-26).
 */
const REFUSING_5XX = new Set([501]);

const MAX_RETRIES = 2;

/**
 * `retry` for every console query.
 *
 * React Query's default retries three times with a growing delay, which for a
 * refusal means the user watches a loading skeleton for about eight seconds
 * and is then told what the first answer already said. That matters here more
 * than elsewhere: the console's error states are written around 404 ("the
 * server does not have this yet"), and until the backend ships
 * /api/platform/* every screen answers 404.
 *
 * An error with no response at all is the network, so it keeps its retries.
 */
export const retryPlatformQuery = (failureCount, error) => {
  const status = error?.response?.status;
  if (typeof status !== "number") return failureCount < MAX_RETRIES;
  const isRefusal =
    (status >= 400 && status < 500 && !WORTH_RETRYING.has(status)) || REFUSING_5XX.has(status);
  if (isRefusal) return false;
  return failureCount < MAX_RETRIES;
};

/** A 404: the route is not deployed, or the thing asked for does not exist. */
export const isNotDeployed = (error) => error?.response?.status === 404;

const text = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

/**
 * A 501, read: the server holds the route but not the data.
 *
 * Distinct from a 404 ("I have not built this") and from a 500 ("I broke").
 * The Merchant tab's nine fields are Stripe account state, and the server
 * chose 501 over 200-with-nulls for the same reason the console drops money
 * columns instead of dashing them: `chargesEnabled: null` on screen reads as
 * "this client cannot charge", and nobody has checked that.
 *
 * `needs` is sent so the tab can say what it is waiting on rather than just
 * failing. Null for anything that is not a 501.
 */
export const notServedFrom = (error) => {
  if (error?.response?.status !== 501) return null;
  const data = error.response.data;
  return {
    resource: text(data?.resource),
    message: text(data?.msg),
    needs: Array.isArray(data?.needs) ? data.needs.map(text).filter(Boolean) : [],
  };
};

const NOT_SERVED_FALLBACK = "The server does not serve this data yet. Nothing was changed.";

/**
 * One line for the error state. The server's `msg` is used verbatim where
 * there is one — it is written to be read — and the needs follow it as a
 * sentence rather than a list, because this state renders inside a paragraph.
 */
export const notServedText = ({ message, needs } = {}) => {
  const head = message ?? NOT_SERVED_FALLBACK;
  const list = Array.isArray(needs) ? needs.filter(Boolean) : [];
  return list.length === 0 ? head : `${head} Waiting on: ${list.join("; ")}.`;
};
