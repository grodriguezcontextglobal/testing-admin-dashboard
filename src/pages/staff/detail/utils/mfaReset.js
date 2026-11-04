/**
 * Resetting someone's MFA from their staff profile (FedRAMP A5 · IA-5).
 *
 * For the person who lost the phone with the authenticator app *and* their
 * recovery codes. POST /api/admin/mfa/reset/:adminUserId signs them out
 * everywhere and emails them a password-reset link. Following it is the only
 * way to set MFA up again: the password alone no longer does it
 * (BACKEND_fedramp_a5_reset_email_step_REPLY_2026-10-30.md). The answer says
 * whether that email was queued (`resetEmailSent`).
 *
 * The server refuses it on your own account, without `staff:update` or
 * super_user, and for someone who also belongs to other companies (403); and
 * for someone outside the company in context (404).
 */

/* Whoever asks for this could be an attacker who has the password and wants
   the second factor gone, so the check happens outside the app. */
export const MFA_RESET_CONFIRMATION = {
  title: "Reset this person's MFA?",
  description:
    "Only do this after confirming their identity another way, like a phone call or in person. They will be signed out everywhere and emailed a link to choose a new password and set up MFA again.",
  okText: "Reset MFA",
};

export const mfaResetErrorMessage = (err) => {
  const status = err?.response?.status;
  const msg = err?.response?.data?.msg;
  if (status === 403) {
    return msg || "You are not allowed to reset MFA for this person.";
  }
  if (status === 404) {
    return msg || "This person is not part of this company.";
  }
  return msg || "MFA was not reset. Please try again.";
};

/**
 * What the admin is told after a reset that went through.
 * `resetEmailSent: false` means the reset happened but the email was not
 * queued; a server without the field gets the wording from before.
 */
export const mfaResetSuccessNotice = (responseData, firstName) => {
  const name = firstName || "This person";
  if (responseData?.resetEmailSent === true) {
    return {
      type: "success",
      title: "MFA reset.",
      description: `${name} was signed out and we emailed them a link to choose a new password and set up MFA again.`,
    };
  }
  if (responseData?.resetEmailSent === false) {
    return {
      type: "warning",
      title: "MFA reset, but the email was not sent.",
      description: `${name} was signed out. Ask them to use "Forgot password" on the sign-in page to get the link to set up MFA again.`,
    };
  }
  return {
    type: "success",
    title: "MFA reset.",
    description: `${name} was signed out and will set up MFA again at the next sign-in.`,
  };
};
