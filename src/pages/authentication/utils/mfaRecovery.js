/**
 * MFA recovery codes (FedRAMP A5 · IA-2, IA-5;
 * FRONTEND_fedramp_a5_mfa_recovery_2026-10-27.md).
 *
 * Losing the phone with the authenticator app used to lock an account out
 * for good, since MFA is mandatory. The server now issues ten one-time
 * recovery codes when MFA is turned on (POST /admin/mfa/verify) or when they
 * are regenerated (POST /admin/mfa/recovery-codes). It keeps only their
 * hashes, so this is the one moment they can be shown.
 *
 * Every sign-in returns `recoveryCodesRemaining`: a number when the account
 * has MFA, null when it has none. Signing in with a recovery code also
 * returns `recoveryCodeUsed`. The sign-in screen unmounts as it navigates, so
 * the notice about the codes left travels through sessionStorage and App
 * shows it.
 */

export const RECOVERY_NOTICE_KEY = "devitrak-recovery-notice";

/** The codes in a verify or regenerate answer, or null when there are none. */
export const readRecoveryCodes = (responseData) => {
  const codes = Array.isArray(responseData?.recoveryCodes)
    ? responseData.recoveryCodes.filter((code) => typeof code === "string" && code.trim())
    : [];
  return codes.length ? codes : null;
};

/** What the "Download" button saves. */
export const recoveryCodesFileText = (codes, { email, date = new Date() } = {}) =>
  [
    "Devitrak two-step verification recovery codes",
    email ? `Account: ${email}` : null,
    `Generated: ${date.toISOString().slice(0, 10)}`,
    "",
    "Each code works once. Use one to sign in if you lose the device with your",
    "authenticator app. Keep them somewhere safe and private.",
    "",
    ...codes,
    "",
  ]
    .filter((line) => line !== null)
    .join("\n");

/** { remaining } after a sign-in that used a recovery code, else null. */
export const readRecoveryCodeUse = (loginResponseData) => {
  if (!loginResponseData?.recoveryCodeUsed) return null;
  const remaining = Number(loginResponseData.recoveryCodesRemaining);
  return { remaining: Number.isFinite(remaining) ? remaining : 0 };
};

const codesLeft = (remaining) =>
  remaining <= 0
    ? "No recovery codes left"
    : `${remaining} recovery code${remaining === 1 ? "" : "s"} left`;

/** Insistent, and kept on screen, at two codes or fewer. */
export const recoveryCodeUseNotice = ({ remaining }) => {
  const urgent = remaining <= 2;
  return {
    type: urgent ? "error" : "warning",
    title: `You signed in with a recovery code. ${codesLeft(remaining)}.`,
    description: urgent
      ? "Set up two-step verification on your new device or generate new codes now, in Profile → Multi-Factor Authentication, before you run out."
      : "Set up two-step verification on your new device or generate new codes in Profile → Multi-Factor Authentication.",
    persistent: urgent,
  };
};

/** At this many codes or fewer, an ordinary sign-in warns too. */
const LOW_RECOVERY_CODES = 2;

/**
 * For an ordinary sign-in (GovRAMP #3, IA-2(1), IA-5): someone who ran out of
 * codes never signs in with one, so they are told here. Kept on screen at
 * zero, when losing the phone would lock the account out.
 */
export const lowRecoveryCodesNotice = ({ remaining }) => {
  const none = remaining <= 0;
  return {
    type: none ? "error" : "warning",
    title: `${codesLeft(remaining)}.`,
    description: none
      ? "If you lose the device with your authenticator app, you will not be able to sign in. Generate new codes in Profile → Multi-Factor Authentication."
      : "Generate new codes in Profile → Multi-Factor Authentication before you run out.",
    persistent: none,
  };
};

// null means the account has no MFA. Number(null) is 0, so it is checked
// before converting, or it would read as "no codes left".
const readRemaining = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const remaining = Number(value);
  return Number.isFinite(remaining) ? remaining : null;
};

/** The notice a successful sign-in calls for, or null. */
export const loginRecoveryNotice = (loginResponseData) => {
  const use = readRecoveryCodeUse(loginResponseData);
  if (use) return recoveryCodeUseNotice(use);
  const remaining = readRemaining(loginResponseData?.recoveryCodesRemaining);
  if (remaining === null || remaining > LOW_RECOVERY_CODES) return null;
  return lowRecoveryCodesNotice({ remaining });
};

export const stashRecoveryNotice = (storage, notice) => {
  try {
    storage.setItem(RECOVERY_NOTICE_KEY, JSON.stringify(notice));
  } catch {
    // Without sessionStorage the notice is lost; the codes still work.
  }
};

/** The stashed notice, once; null when there is none. */
export const takeRecoveryNotice = (storage) => {
  try {
    const stored = storage.getItem(RECOVERY_NOTICE_KEY);
    storage.removeItem(RECOVERY_NOTICE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};
