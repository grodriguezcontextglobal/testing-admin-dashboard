/**
 * Pure logic for InvitationLanding — the accept-invitation payload and the
 * message shown when the invitation is gone.
 */

export const NO_INVITATION_MESSAGE =
  "This invitation is no longer valid. Ask your administrator to send you a new one.";

export const INVALID_LINK_MESSAGE =
  "This invitation link isn't valid or has expired. Ask your administrator to send you a new one.";

export const ALREADY_ACCEPTED_MESSAGE =
  "You already accepted this invitation. Sign in to continue.";

const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try later.";

/**
 * Body for POST /registration/accept-invitation.
 *
 * The signed `token` of the emailed link is what authenticates the request:
 * the server takes the email and the company from it and ignores any in the
 * body, so neither is sent. The role is absent too — it comes from the
 * invitation in Company.employees, never from the person accepting it.
 * The password goes only for a new account.
 */
export const buildAcceptInvitationPayload = ({
  invitationToken,
  firstName,
  lastName,
  password,
}) => ({
  invitationToken,
  user: {
    name: firstName,
    lastName,
    ...(password ? { password } : {}),
  },
});

export const isInvitationAlreadyAccepted = (error) =>
  error?.response?.status === 409 &&
  Boolean(error.response.data?.invitationAlreadyAccepted);

/**
 * A 404 from accept-invitation means the email is not in Company.employees —
 * the invitation was revoked, already used, or aimed at another company. The
 * server phrases that for an operator; this phrases it for the person holding
 * the dead link.
 */
export const invitationErrorMessage = (error) => {
  if (error?.response?.data?.invitationLinkInvalid) return INVALID_LINK_MESSAGE;
  if (isInvitationAlreadyAccepted(error)) return ALREADY_ACCEPTED_MESSAGE;
  if (error?.response?.status === 404) return NO_INVITATION_MESSAGE;
  return error?.response?.data?.msg ?? GENERIC_ERROR_MESSAGE;
};
