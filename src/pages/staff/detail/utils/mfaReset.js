/**
 * Resetting someone's MFA from their staff profile (FedRAMP A5 · IA-5).
 *
 * For the person who lost the phone with the authenticator app *and* their
 * recovery codes. POST /api/admin/mfa/reset/:adminUserId signs them out
 * everywhere, and their next sign-in (with the password) asks them to set MFA
 * up again, like a new account.
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
    "Only do this after confirming their identity another way, like a phone call or in person. They will be signed out everywhere and asked to set up MFA again the next time they sign in.",
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
