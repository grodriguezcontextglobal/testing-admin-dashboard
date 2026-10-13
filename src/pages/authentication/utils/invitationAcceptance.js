/**
 * Pure logic for InvitationLanding — the accept-invitation payload and the
 * message shown when the invitation is gone.
 */

export const NO_INVITATION_MESSAGE =
  "This invitation is no longer valid. Ask your administrator to send you a new one.";

const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try later.";

/**
 * Body for POST /registration/accept-invitation.
 *
 * Identity only. The role is deliberately absent: the route carries no
 * authentication, so while roleType travelled in the body the invited person
 * could ask for root_admin and land with it in company_staff, which is the
 * source of truth on the SQL side. The backend now resolves the role from the
 * invitation already sitting in Company.employees and returns the one it used.
 */
export const buildAcceptInvitationPayload = ({
  firstName,
  lastName,
  email,
  companyName,
  password,
}) => ({
  user: {
    name: firstName,
    lastName,
    email,
    ...(password ? { password } : {}),
  },
  company: { company_name: companyName },
});

/**
 * A 404 from accept-invitation means the email is not in Company.employees —
 * the invitation was revoked, already used, or aimed at another company. The
 * server phrases that for an operator; this phrases it for the person holding
 * the dead link.
 */
export const invitationErrorMessage = (error) => {
  if (error?.response?.status === 404) return NO_INVITATION_MESSAGE;
  return error?.response?.data?.msg ?? GENERIC_ERROR_MESSAGE;
};
