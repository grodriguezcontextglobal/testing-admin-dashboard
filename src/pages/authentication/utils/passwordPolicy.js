import * as yup from "yup";
import { normalizeMfaCode, readMfaSetupChallenge } from "./mfaEnrollment";

/**
 * The password rule, and what a password change sends.
 *
 * Registration and the invitation landing already asked for eight characters
 * with an uppercase letter, a lowercase letter, a number and a symbol. The two
 * screens that change a password did not: the profile page took 6 to 12
 * characters of anything, and the reset link 6 to 20. Both now read the rule
 * from here, so it cannot drift again.
 *
 * The symbol set is the one registration has always checked, so a password
 * accepted here is accepted everywhere else.
 */

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULES = Object.freeze([
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  { id: "uppercase", label: "One uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { id: "lowercase", label: "One lowercase letter", test: (value) => /[a-z]/.test(value) },
  { id: "number", label: "One number", test: (value) => /\d/.test(value) },
  {
    id: "symbol",
    label: 'One symbol (!@#$%^&*(),.?":{}|<>)',
    test: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
  },
]);

export const checkPassword = (password) => {
  const value = String(password ?? "");
  const rules = PASSWORD_RULES.map(({ id, label, test }) => ({ id, label, met: test(value) }));
  const metCount = rules.filter((rule) => rule.met).length;
  return { rules, metCount, isValid: metCount === PASSWORD_RULES.length };
};

/** What the bar under the field shows: how far along, in words and a tone. */
export const passwordStrength = (password) => {
  if (!password) return { percent: 0, label: "", tone: "none" };
  const { metCount } = checkPassword(password);
  const percent = Math.round((metCount / PASSWORD_RULES.length) * 100);
  if (metCount === PASSWORD_RULES.length) return { percent, label: "Strong", tone: "success" };
  if (metCount >= 3) return { percent, label: "Fair", tone: "warning" };
  return { percent, label: "Weak", tone: "danger" };
};

export const newPasswordSchema = yup.object().shape({
  password: yup
    .string()
    .required("Password is required")
    .test(
      "password-policy",
      "Password must have 8+ characters, an uppercase and a lowercase letter, a number and a symbol",
      (value) => checkPassword(value).isValid,
    ),
  password2: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
});

/**
 * `PATCH /admin/update-password` (FRONTEND_password_reset_mfa_2026-10-13.md).
 * Still without a session token: the server checks the MFA code itself, which
 * is what proves the request comes from the account holder — so the current
 * password is no longer asked for, and no hash is compared in the browser.
 *
 * The account is named by its email, which the reset link carries and the
 * signed-in session already has. A link sent before the email was added only
 * has the `uid`, which the server also accepts.
 */
export const buildPasswordUpdatePayload = ({ resetToken, uid, email, password, mfaCode }) => {
  const cleanEmail = String(email ?? "").trim();
  const code = normalizeMfaCode(mfaCode);
  /* A link the server signed names the account by its `token`; the server
     then ignores uid and email, so they are not sent. */
  const account = resetToken
    ? { resetToken }
    : cleanEmail
      ? { email: cleanEmail }
      : { uid };
  return {
    ...account,
    password,
    /* Sent without a code only to ask whether the account has MFA: the server
       saves nothing and answers `mfaRequired` or `mfaSetupRequired`. */
    ...(code ? { mfaCode: code } : {}),
  };
};

/**
 * Body for POST /nodemailer/reset-admin-password. The server builds and signs
 * the link itself and ignores one sent by the client, so the address is all
 * it takes. It answers 202 whether or not the account exists, on purpose.
 */
export const buildResetEmailRequest = (email) => ({
  contactInfo: { email: String(email ?? "").trim() },
});

/**
 * A wrong code and an unknown account get the same 400 on purpose, so nobody
 * can probe which emails exist; the message keeps them together too.
 */
const serverMessageOf = (error) => {
  const data = error?.response?.data;
  return data?.msg ?? data?.error ?? data?.message;
};

/** The MFA answers any code-protected route gives, or null for anything else. */
export const describeMfaError = (error) => {
  const data = error?.response?.data;
  if (data?.mfaSetupRequired) {
    return "Your account doesn't have two-step verification set up. Contact an administrator.";
  }
  if (data?.mfaRequired) {
    return "Enter the code from your authenticator app to confirm the change.";
  }
  const serverMessage = serverMessageOf(error);
  if (typeof serverMessage === "string" && /mfa code/i.test(serverMessage)) {
    return "The code or the account isn't valid. Codes expire every 30 seconds — try the one showing now.";
  }
  return null;
};

export const describePasswordUpdateError = (error) => {
  const mfaMessage = describeMfaError(error);
  if (mfaMessage) return mfaMessage;
  const serverMessage = serverMessageOf(error);
  if (typeof serverMessage === "string" && serverMessage) return serverMessage;
  return "We couldn't update your password. Please try again.";
};

/**
 * What the password screens do with a refused `update-password`
 * (FRONTEND_password_reset_sin_mfa_2026-10-13.md).
 *
 * - `enroll`: the account has no MFA and the client can set it up — with the
 *   `mfaSetupToken` the server handed over, or on the open session when the
 *   user is signed in.
 * - `setupUnavailable`: no MFA, and nothing to authenticate `/mfa/generate`
 *   with. The server only hands the setup token to a request carrying a link
 *   it signed, so this is a link sent before it did.
 * - `linkInvalid`: the signed link is fake, older than an hour, or used.
 * - `enterCode`: the account already has MFA; the code is what is missing.
 * - `error`: anything else, already in words for the page.
 */
export const readPasswordMfaOutcome = (error, { hasSession = false } = {}) => {
  const challenge = readMfaSetupChallenge(error);
  if (challenge) return { action: "enroll", setupToken: challenge.setupToken };
  const data = error?.response?.data;
  if (data?.mfaSetupRequired) {
    return hasSession ? { action: "enroll", setupToken: undefined } : { action: "setupUnavailable" };
  }
  if (data?.resetLinkInvalid) return { action: "linkInvalid" };
  if (data?.mfaRequired) return { action: "enterCode" };
  return { action: "error", message: describePasswordUpdateError(error) };
};
