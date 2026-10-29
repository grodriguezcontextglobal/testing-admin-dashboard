/**
 * The error MyDevicesPortal shows when a lookup fails.
 *
 * The server allows 10 lookups per IP every 15 minutes
 * (FRONTEND_fedramp_a2_lote2_2026-10-27.md, AC-7). Its 429 may not carry a
 * `msg`, and the not-found fallback would then tell the person their record
 * does not exist.
 */
export const TOO_MANY_ATTEMPTS_MESSAGE = "Too many attempts. Please try again later.";
export const NOT_FOUND_MESSAGE = "No record found for that student ID and email.";

export const myDevicesLookupError = (err) => {
  if (err?.response?.status === 429) return TOO_MANY_ATTEMPTS_MESSAGE;
  return err?.response?.data?.msg || NOT_FOUND_MESSAGE;
};
