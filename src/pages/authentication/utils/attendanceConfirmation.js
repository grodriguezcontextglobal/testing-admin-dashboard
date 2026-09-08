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
