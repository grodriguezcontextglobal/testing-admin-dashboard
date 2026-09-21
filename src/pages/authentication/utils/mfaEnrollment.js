/**
 * Who still has to enrol in multi-factor authentication, and what the enrolment
 * calls have to carry.
 *
 * The server only challenges for a code when the account already has
 * `mfaEnabled` (`controller/admin.js`, `loginUser`). An account that never
 * enrolled therefore logs straight in and the server says nothing about it —
 * which is why making MFA mandatory cannot be done by reading the answer's
 * status code. The client has to look at the account it just authenticated and
 * stop the session before it goes anywhere.
 *
 * > "let's force that you have to have the multi-factor authentication
 * > activated" — beta testing 2026-09-18, part 1 `6:38`.
 *
 * Kept out of the modal so the rule is testable without rendering a QR code,
 * and so both entry points — the login gate and registration — read the same
 * one.
 */

/** Digits in a TOTP code. `speakeasy.totp` on the server issues six. */
export const MFA_CODE_LENGTH = 6;

/**
 * Whether the authenticated account already has MFA on.
 *
 * `entire` is the whole admin document as the login route returns it. A missing
 * flag counts as not enrolled: accounts predating the field are exactly the
 * ones this rule exists for, and reading absence as "fine" would wave them all
 * through.
 */
export const isMfaEnrolled = (loginResponseData) =>
  Boolean(loginResponseData?.entire?.mfaEnabled ?? loginResponseData?.mfaEnabled);

export const needsMfaEnrollment = (loginResponseData) =>
  !isMfaEnrolled(loginResponseData);

/**
 * The same login response, with the flag the enrolment just turned on.
 *
 * The response was captured before `/mfa/verify` ran, and it is what `onLogin`
 * copies into the admin slice (`state.mfaEnabled = payload.data?.mfaEnabled`).
 * Handing the unpatched copy to the session would tell the profile page MFA is
 * off on the very session that turned it on.
 */
export const markEnrolled = (loginResponseData) => ({
  ...loginResponseData,
  entire: { ...loginResponseData?.entire, mfaEnabled: true },
});

/** Only the digits, never more than the app asks for. */
export const normalizeMfaCode = (value) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, MFA_CODE_LENGTH);

export const isCompleteMfaCode = (value) =>
  normalizeMfaCode(value).length === MFA_CODE_LENGTH;

/**
 * Auth for `/api/admin/mfa/*`, which sits behind `validateJWT`.
 *
 * Enrolment runs before the session exists — at the login gate nothing has been
 * written to localStorage yet, and during registration nothing ever will be —
 * so the token travels as an explicit header rather than through the request
 * interceptor, which reads `localStorage["admin-token"]`.
 *
 * With no token the config is empty and the interceptor's own header applies,
 * which is the profile-page case, where a session is already open.
 */
export const mfaRequestConfig = (authToken) =>
  authToken ? { headers: { "x-token": String(authToken) } } : {};
