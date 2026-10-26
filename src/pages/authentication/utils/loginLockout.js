/**
 * What a 429 from `POST /admin/login` means
 * (FRONTEND_login_lockout_password_policy_2026-10-21.md §1).
 *
 * - `account`: five failed passwords or MFA codes in 15 minutes lock the
 *   account for 30, even with the right password. The body says so with
 *   `accountLocked: true` and `retryAfter` in seconds.
 * - `rateLimit`: the older per-IP limit, a 429 without `accountLocked`.
 *
 * The wait comes from the body first: production CORS may not expose the
 * Retry-After header to the page. Neither case is retried automatically.
 */

const LOCKED_PREFIX =
  "Your account is temporarily locked after too many failed sign-in attempts.";

const toSeconds = (value) => {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
};

const waitInWords = (seconds) => {
  if (seconds === null) return "Try again later.";
  const minutes = Math.ceil(seconds / 60);
  return `Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`;
};

export const readLoginLockout = (error) => {
  const response = error?.response;
  if (response?.status !== 429) return null;
  const data = response.data ?? {};
  const retryAfterSeconds =
    toSeconds(data.retryAfter) ?? toSeconds(response.headers?.["retry-after"]);

  if (data.accountLocked === true) {
    return {
      kind: "account",
      retryAfterSeconds,
      message: `${LOCKED_PREFIX} ${waitInWords(retryAfterSeconds)}`,
    };
  }
  return {
    kind: "rateLimit",
    retryAfterSeconds,
    message: "Too many sign-in attempts from this network. Wait a few minutes and try again.",
  };
};

/**
 * The warning before the lock: a failed sign-in (wrong password, wrong MFA
 * code or unknown email) carries `attemptsRemaining`, so a person no longer
 * goes from "wrong password" straight to "locked". Absent when the server's
 * counter is unavailable; then nothing is said.
 */
export const readAttemptsRemaining = (error) => {
  const response = error?.response;
  if (!response || response.status === 429) return null;
  const left = Number(response.data?.attemptsRemaining);
  if (!Number.isInteger(left) || left < 1) return null;
  return `${left} ${left === 1 ? "attempt" : "attempts"} left before your account is temporarily locked.`;
};
