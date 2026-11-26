// What the console gate decides, given the sign-in hint and the server's
// answer to GET /api/platform/me. Pure: no React, no I/O.

export const GATE_ALLOW = "allow";
export const GATE_REFUSE = "refuse";
export const GATE_WAIT = "wait";

/**
 * The one fact /me is read for, out of
 * `{ ok, data: { uid, email, platformAccess, domain, platformObserver,
 * mfaEnabled, checkedAt } }` (backend note of 2026-11-19).
 *
 * Strictly `=== true`, the same rule the sign-in field has in roles.js. A
 * server that starts sending the string "true" is a contract change we should
 * notice on the next deploy, not one we quietly absorb.
 */
export const platformMeAccess = (body) => body?.data?.platformAccess === true;

// The two statuses that mean the server read the five facts and said no.
// Everything else -- a 500, a deploy, a rate limit, a route this host does not
// have -- means we failed to ask, which is a different thing.
const REFUSALS = new Set([401, 403]);

const isRefusal = (error) => REFUSALS.has(error?.response?.status);

/**
 * allow / refuse / wait, for PlatformGuard.
 *
 * Why this exists at all: the guard used to read `platformAccess` out of the
 * sign-in response and nothing else. That is the screens' own copy of the
 * answer, taken once and never refreshed -- and redux-persist writes the store
 * to localStorage, so the copy outlives the tab. An operator whose access was
 * revoked kept seeing console screens until they signed out, not merely until
 * they reloaded. Nothing leaked, because every /api/platform request is
 * refused by the server's own gate, but the first thing they saw was an error
 * rather than a refusal that explains itself.
 *
 * So the sign-in field is now a hint and `/me` is the answer. The order of the
 * rules below is the whole design:
 *
 * 1. A hint of "no" refuses without a request. The server would refuse too,
 *    and this keeps the dashboard host from firing a cross-origin call on
 *    behalf of someone who will never pass.
 * 2. A refusal outranks cached data, because a revocation arrives as a 401 on
 *    a background refetch while the last good answer is still in the cache.
 *    The error is the newer answer.
 * 3. An answer decides it.
 * 4. Any other failure keeps the hint's answer. Locking every operator out of
 *    a read-only console over a blip would be worse than the stale copy we are
 *    replacing, and the server still gates every request behind the screen.
 * 5. Otherwise we have not been told yet, so we wait rather than guess. Guessing
 *    "allow" here is the stale copy again; guessing "refuse" shows the refusal
 *    page to an operator who has access, every single load.
 */
export const platformGateVerdict = ({ hint = false, data, error } = {}) => {
  if (hint !== true) return GATE_REFUSE;
  if (isRefusal(error)) return GATE_REFUSE;
  if (data !== undefined && data !== null) return platformMeAccess(data) ? GATE_ALLOW : GATE_REFUSE;
  if (error) return GATE_ALLOW;
  return GATE_WAIT;
};
