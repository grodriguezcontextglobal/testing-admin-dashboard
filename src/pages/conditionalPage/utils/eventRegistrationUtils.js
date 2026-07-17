/**
 * Pure logic for "Register members to event" + the public attendance
 * confirmation landing. Kept out of components so it can be unit-tested.
 *
 * Persistence model (explicit product decision): nothing is written to the
 * consumers collection when the invitation email is sent. A member becomes an
 * event attendee only after the recipient clicks Confirm on the public
 * landing page, which runs the consumer create-or-update sequence mirrored
 * from src/pages/consumers/utils/CreateNewUser.jsx.
 */

/** Members come from SQL (`minor` may be boolean or the numeric 0/1 from
 * /db_member/consulting-member) — normalize both shapes. */
const isMinorMember = (member = {}) =>
  member?.minor === true || Number(member?.minor) === 1;

/**
 * Resolves who should receive the attendance-confirmation email:
 * the guardian for minors, the member otherwise. Minors without a guardian
 * email must be reported (not silently skipped), so the required email
 * missing case is returned as `{ email: null, error }` rather than thrown —
 * callers (e.g. the bulk-send flow) can collect these as per-row failures.
 *
 * @param {object} member member record (first_name, last_name, email, minor,
 *   parent_guardian_email, ...)
 * @returns {{ email: string|null, isGuardian: boolean, error: string|null }}
 */
export const getConfirmationRecipient = (member = {}) => {
  const isGuardian = isMinorMember(member);
  if (isGuardian) {
    const guardianEmail = `${member.parent_guardian_email ?? ""}`.trim();
    if (!guardianEmail) {
      return {
        email: null,
        isGuardian: true,
        error: "Missing guardian email for this minor member.",
      };
    }
    return { email: guardianEmail, isGuardian: true, error: null };
  }
  const memberEmail = `${member.email ?? ""}`.trim();
  if (!memberEmail) {
    return {
      email: null,
      isGuardian: false,
      error: "Member has no email address.",
    };
  }
  return { email: memberEmail, isGuardian: false, error: null };
};

export const ATTENDANCE_CONFIRMATION_PATH = "/attendance-confirmation";

const eventNameOf = (event = {}) =>
  event?.eventInfoDetail?.eventName ?? event?.eventName ?? "";

/**
 * Builds the public confirmation link. There is no signed-token
 * infrastructure — same trust model as the existing `/invitation` flow —
 * so every value is a plain, encoded query param.
 *
 * @param {string} origin e.g. window.location.origin
 * @param {object} member
 * @param {object} event event record (`id`, `eventInfoDetail.eventName`)
 * @param {object} company `{ id, name }`
 * @returns {string}
 */
export const buildConfirmationLink = (origin, member = {}, event = {}, company = {}) => {
  const minor = isMinorMember(member);
  const params = new URLSearchParams({
    memberEmail: member.email ?? "",
    memberFirstName: member.first_name ?? "",
    memberLastName: member.last_name ?? "",
    eventId: event?.id ?? "",
    eventName: eventNameOf(event),
    company: company?.name ?? "",
    companyId: company?.id ?? "",
    minor: minor ? "true" : "false",
    guardianEmail: minor ? (member.parent_guardian_email ?? "") : "",
  });
  const base = `${origin ?? ""}`.replace(/\/$/, "");
  return `${base}${ATTENDANCE_CONFIRMATION_PATH}?${params.toString()}`;
};

const REQUIRED_CONFIRMATION_PARAMS = [
  "memberEmail",
  "eventId",
  "eventName",
  "company",
  "companyId",
];

/**
 * Parses + validates the confirmation landing's query params. Accepts a
 * URLSearchParams instance or a plain object (tests, SSR-style usage).
 * All returned strings are untrusted display data — render as text only.
 *
 * @param {URLSearchParams|object} searchParams
 * @returns {object|{error: string}}
 */
export const parseConfirmationParams = (searchParams) => {
  const get = (key) => {
    if (!searchParams) return "";
    if (typeof searchParams.get === "function") return searchParams.get(key) ?? "";
    return searchParams[key] ?? "";
  };
  const result = {
    memberEmail: `${get("memberEmail")}`,
    memberFirstName: `${get("memberFirstName")}`,
    memberLastName: `${get("memberLastName")}`,
    eventId: `${get("eventId")}`,
    eventName: `${get("eventName")}`,
    company: `${get("company")}`,
    companyId: `${get("companyId")}`,
    minor: get("minor") === "true",
    guardianEmail: `${get("guardianEmail")}`,
  };
  const missing = REQUIRED_CONFIRMATION_PARAMS.filter((key) => !result[key]);
  if (missing.length) {
    return { error: "This confirmation link is invalid or incomplete." };
  }
  return result;
};

/**
 * Builds the consumer create-or-update payloads, mirroring
 * src/pages/consumers/utils/CreateNewUser.jsx exactly:
 *  - no existing consumer -> `auth` (`POST /auth/new`) + `db`
 *    (`POST /db_consumer/new_consumer`) payloads.
 *  - existing consumer -> `merge` (`PATCH /auth/:id`) payload, deduping the
 *    four tracking arrays with `new Set`.
 *
 * @param {object} member
 * @param {object} event
 * @param {object} company `{ id, name }`
 * @param {object|null} existingConsumer consumer record from
 *   `POST /auth/user-query`, or null when the member doesn't exist yet
 * @returns {{auth: object, db: object}|{merge: object}}
 */
export const buildConsumerEventPayloads = (
  member = {},
  event = {},
  company = {},
  existingConsumer = null,
) => {
  const eventName = eventNameOf(event);
  const memberFirstName = member.first_name ?? member.memberFirstName ?? "";
  const memberLastName = member.last_name ?? member.memberLastName ?? "";
  const memberEmail = member.email ?? member.memberEmail ?? "";

  if (existingConsumer) {
    return {
      merge: {
        id: existingConsumer.id,
        eventSelected: [
          ...new Set([...(existingConsumer.eventSelected ?? []), eventName]),
        ],
        provider: [...new Set([...(existingConsumer.provider ?? []), company?.name])],
        company_providers: [
          ...new Set([...(existingConsumer.company_providers ?? []), company?.id]),
        ],
        event_providers: [
          ...new Set([...(existingConsumer.event_providers ?? []), event?.id]),
        ],
      },
    };
  }

  return {
    auth: {
      name: memberFirstName,
      lastName: memberLastName,
      email: memberEmail,
      phoneNumber: member.phone_number ?? member.phone ?? "",
      privacyPolicy: true,
      category: "Regular",
      provider: [company?.name],
      eventSelected: [eventName],
      company_providers: [company?.id],
      event_providers: [event?.id],
      groupName: [],
    },
    db: {
      first_name: memberFirstName,
      last_name: memberLastName,
      email: memberEmail,
      phone_number: `${member.phone_number ?? member.phone ?? ""}`,
    },
  };
};

const formatEventDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Builds the `{ to, subject, message }` shape for the generic nodemailer
 * endpoint (`POST /nodemailer/internal-single-email-notification` — see
 * DeleteItemModal.jsx for the payload envelope this fills). English copy.
 *
 * @param {object} params
 * @param {object} params.member
 * @param {object} params.event
 * @param {{email: string, isGuardian: boolean}} params.recipient
 * @param {string} params.confirmationLink
 * @returns {{to: string, subject: string, message: string}}
 */
export const buildAttendanceEmail = ({ member, event, recipient, confirmationLink }) => {
  const memberName = `${member?.first_name ?? ""} ${member?.last_name ?? ""}`.trim() || "this member";
  const eventName = eventNameOf(event) || "the event";
  const dateBegin = formatEventDate(event?.eventInfoDetail?.dateBegin);
  const dateEnd = formatEventDate(event?.eventInfoDetail?.dateEnd);
  const dateRange =
    dateBegin && dateEnd && dateBegin !== dateEnd
      ? `${dateBegin} - ${dateEnd}`
      : dateBegin || dateEnd || "";

  const subject = `Please confirm attendance for ${eventName}`;

  const opening = recipient?.isGuardian
    ? `You are receiving this message on behalf of ${memberName}.`
    : `Hi ${memberName},`;

  const message = [
    opening,
    `You have been invited to attend ${eventName}${dateRange ? ` (${dateRange})` : ""}.`,
    "Please confirm attendance using the link below:",
    confirmationLink,
  ].join("\n\n");

  return {
    to: recipient?.email,
    subject,
    message,
  };
};
