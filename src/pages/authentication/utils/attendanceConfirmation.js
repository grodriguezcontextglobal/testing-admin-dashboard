/**
 * The public attendance-confirmation landing: who is being asked, and what the
 * page may claim once it has written.
 *
 * The link carries `company`, `minor` and `guardianEmail`, and the page rendered
 * none of them. A guardian opening a link about their child was shown
 * "{child} has been invited" and a Confirm button, with no statement that they
 * are the one confirming, and no mention of who was doing the inviting.
 */

const text = (value) => String(value ?? "").trim();

/**
 * Who is reading this page, and on whose behalf.
 *
 * For a minor the confirming person is the guardian — which is what the write
 * has always done, and what the page never said.
 */
export const describeInvitation = (parsed) => {
  const memberName =
    [parsed?.memberFirstName, parsed?.memberLastName]
      .map(text)
      .filter(Boolean)
      .join(" ") || text(parsed?.memberEmail);

  const eventName = text(parsed?.eventName);
  const company = text(parsed?.company);
  const isMinor = Boolean(parsed?.minor);
  const guardianEmail = text(parsed?.guardianEmail);

  return {
    memberName,
    eventName,
    company,
    isMinor,
    guardianEmail,
    /** The heading: the decision, not the record. */
    heading: isMinor ? "Confirm your child's attendance" : "Confirm your attendance",
    /** One sentence saying who is invited, by whom. */
    invitedLine: company
      ? `${memberName} is invited by ${company} to ${eventName}.`
      : `${memberName} is invited to ${eventName}.`,
    /** Said only when it is true, so it never reads as boilerplate. */
    roleLine: isMinor
      ? `You are confirming as ${memberName}'s parent or guardian${
          guardianEmail ? ` (${guardianEmail})` : ""
        }.`
      : null,
  };
};

/**
 * Whether this consumer is already on the event.
 *
 * Compared as strings: the id from the URL is always a string and the one on
 * the record may be a number, so `===` reported "not confirmed" for somebody
 * who was — and the page offered to confirm them again.
 */
export const isAlreadyInEvent = (consumer, eventId) => {
  const wanted = text(eventId);
  if (!wanted) return false;
  return (consumer?.event_providers ?? []).some(
    (id) => text(id) === wanted
  );
};

/**
 * The consumer this email already belongs to, or null.
 *
 * `.at(-1)` matches CreateNewUser: the newest record wins when an email somehow
 * has more than one.
 */
export const readExistingConsumer = (lookupResponse) => {
  const data = lookupResponse?.data;
  if (!data?.ok) return null;
  const users = Array.isArray(data.users) ? data.users : [];
  return users.length > 0 ? users.at(-1) : null;
};

/**
 * Whether a write actually landed.
 *
 * `POST /auth/new` answers 200 with `{ ok: false }` when it refuses, and the
 * page went on to create the SQL consumer and report the attendance confirmed
 * for a person who had not been created.
 */
export const writeSucceeded = (response) => {
  const data = response?.data;
  if (!data) return false;
  return data.ok !== false;
};

/** What went wrong, in words a guardian can act on. */
export const readConfirmationError = (error) => {
  const msg = error?.response?.data?.msg ?? error?.response?.data?.message;
  return (
    text(msg) ||
    text(error?.message) ||
    "Something went wrong. Please try again."
  );
};

/**
 * Where the page records each response. Public, like the page: the guardian
 * has no session, so the staff activity route cannot take it, and the audit
 * middleware only sees the writes a confirmation makes — not who made them,
 * nor an open or a failed click, which write nothing.
 * Asked of the backend in FRONTEND_event_invitation_responses_2026-10-08.md.
 */
export const INVITATION_RESPONSE_PATH = "/school/event-invitations/response";

/** Every step a person can take on the page, in the order they take them. */
export const INVITATION_RESPONSES = {
  OPENED: "opened",
  CONFIRMED: "confirmed",
  ALREADY_CONFIRMED: "already_confirmed",
  FAILED: "failed",
};

/**
 * One response, as the server stores it.
 *
 * 2026-09-29 `48:52`: "you need to log everything, like when the parent
 * clicked". For a minor the person answering is the guardian the link was
 * sent to. The server stamps the time it receives it; `client_time` only says
 * what the reader's clock showed.
 */
export const buildInvitationResponse = (parsed, response, { reason, now = new Date() } = {}) => {
  const isGuardian = Boolean(parsed?.minor);
  return {
    company_id: text(parsed?.companyId),
    event_id: text(parsed?.eventId),
    event_name: text(parsed?.eventName),
    member_id: text(parsed?.memberId) || null,
    member_email: text(parsed?.memberEmail),
    responder_email: text(isGuardian ? parsed?.guardianEmail : parsed?.memberEmail) || null,
    responder_role: isGuardian ? "guardian" : "member",
    response,
    ...(text(reason) ? { reason: text(reason) } : {}),
    client_time: now.toISOString(),
  };
};

/**
 * Sends one response. Never throws: a response that cannot be recorded — the
 * route is not deployed yet, the network dropped — must not stop the
 * confirmation it describes.
 */
export const recordInvitationResponse = async (api, payload) => {
  try {
    return writeSucceeded(await api.post(INVITATION_RESPONSE_PATH, payload));
  } catch {
    return false;
  }
};
