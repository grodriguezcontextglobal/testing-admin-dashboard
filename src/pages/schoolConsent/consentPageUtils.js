/**
 * React Query retry predicate for the public consent page. Retries
 * transient/network failures (no response, or 5xx) up to 2 extra attempts,
 * but never retries a definitive application error (404/409/410/422) —
 * those reflect real state (invalid link, already responded, expired)
 * that a retry cannot fix.
 *
 * @param {number} failureCount
 * @param {object} error
 * @returns {boolean}
 */
export function shouldRetryTransientError(failureCount, error) {
  const status = error?.response?.status;
  if (status && status < 500) return false;
  return failureCount < 2;
}

/**
 * Human-readable expiry warning for a pending consent link, or null when
 * there's nothing to show (missing/invalid date).
 *
 * @param {string|null|undefined} expiresAt - ISO date string
 * @returns {string|null}
 */
export function formatConsentExpiryMessage(expiresAt) {
  if (!expiresAt) return null;
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return null;
  const formatted = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `This link expires on ${formatted}.`;
}
