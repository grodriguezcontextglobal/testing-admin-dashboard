// Shared React Query behaviour for the Admin Console. Pure: no React, no I/O.

// A timeout and a rate limit are the two client-side statuses where waiting
// and asking again is the right answer. The rest are the server saying no,
// and it will keep saying no.
const WORTH_RETRYING = new Set([408, 429]);

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
  const isRefusal =
    typeof status === "number" && status >= 400 && status < 500 && !WORTH_RETRYING.has(status);
  if (isRefusal) return false;
  return failureCount < MAX_RETRIES;
};
