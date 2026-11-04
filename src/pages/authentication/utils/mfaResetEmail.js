/**
 * Signing in after an admin reset your MFA (FedRAMP A5 · IA-5;
 * BACKEND_fedramp_a5_reset_email_step_REPLY_2026-10-30.md, prod fdd5de2).
 *
 * The reset marks the account and emails the person a password-reset link.
 * Until they follow it, `/admin/login` with the right password answers 403
 * with `mfaSetupRequired` and `mfaResetEmailRequired`, and no setup token: the
 * enrolment modal must not open. The person needs their mailbox, not only
 * the password, so someone who stole the password cannot enrol their own
 * phone. "Send a new email" is the ordinary forgot-password call.
 */

const FALLBACK_MESSAGE =
  "Your MFA was reset. Follow the link we emailed you to set it up again.";

/** `{ message }` for that refused login, or null for every other failure. */
export const readMfaResetEmailChallenge = (error) => {
  const data = error?.response?.data;
  if (data?.mfaResetEmailRequired !== true) return null;
  const message = typeof data.msg === "string" && data.msg.trim() ? data.msg : FALLBACK_MESSAGE;
  return { message };
};

/** "ada@x.com" → "a•••@x.com", or "" when it is not an address. */
export const maskEmail = (email) => {
  const value = String(email ?? "").trim();
  const at = value.indexOf("@");
  if (at < 1 || at === value.length - 1) return "";
  return `${value[0]}•••${value.slice(at)}`;
};
