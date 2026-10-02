/**
 * Who has to be reachable, and how — the one rule the spreadsheet import and
 * the single-member form both apply, so the two cannot disagree about whether
 * a student can be created.
 *
 * Adults: their own email and phone, as before.
 *
 * Minors (decided 2026-09-29, after "some kids don't have an e-mail address"):
 * their own email and phone are optional, because every notice about a minor
 * already goes to the guardian. The guardian stays fully required — name,
 * email and phone — because the guardian is found and linked by email, and the
 * consent request goes out by email. The guardian's email is deliberately NOT
 * copied onto the student: the event consumer is looked up by email, and two
 * siblings would merge into one.
 */

const filled = (value) => `${value ?? ""}`.trim() !== "";

/**
 * @param {object} member first_name, last_name, email, phone, minor, and the
 *   parent_guardian_* fields
 * @param {{ representativeLabel?: string }} [options]
 * @returns {Record<string, string>} field name -> message, in display order
 */
export const memberContactErrors = (
  member = {},
  { representativeLabel = "Guardian" } = {}
) => {
  const errors = {};
  if (!filled(member.first_name)) errors.first_name = "First name is required.";
  if (!filled(member.last_name)) errors.last_name = "Last name is required.";

  if (!member.minor) {
    if (!filled(member.email)) errors.email = "Email is required.";
    if (!filled(member.phone)) errors.phone = "Phone is required.";
    return errors;
  }

  if (!filled(member.parent_guardian_first_name))
    errors.parent_guardian_first_name = `${representativeLabel} first name is required for minors.`;
  if (!filled(member.parent_guardian_last_name))
    errors.parent_guardian_last_name = `${representativeLabel} last name is required for minors.`;
  if (!filled(member.parent_guardian_email))
    errors.parent_guardian_email = `${representativeLabel} email is required for minors.`;
  if (!filled(member.parent_guardian_phone_number))
    errors.parent_guardian_phone_number = `${representativeLabel} phone number is required for minors.`;
  return errors;
};

/**
 * The server's own rule (branch feat/member-contact-minors), which
 * PATCH /db_member/update-member-info applies to how the whole row ends up:
 *
 *   adult (minor not 1)                     -> email and phone_number
 *   minor with own email and phone_number   -> nothing else
 *   minor missing either                    -> parent_guardian_email
 *
 * Looser than memberContactErrors on purpose. The edit page saves the student
 * before the guardian section even appears for a new minor, so demanding the
 * full guardian there would lock the record.
 *
 * @param {object} row in server field names
 * @returns {Array<"email"|"phone_number"|"parent_guardian_email">}
 */
export const memberContactMissing = (row = {}) => {
  const isMinor = row.minor === true || Number(row.minor) === 1;
  const ownEmail = filled(row.email);
  const ownPhone = filled(row.phone_number);

  if (!isMinor) {
    return [...(ownEmail ? [] : ["email"]), ...(ownPhone ? [] : ["phone_number"])];
  }
  if (ownEmail && ownPhone) return [];
  return filled(row.parent_guardian_email) ? [] : ["parent_guardian_email"];
};

/**
 * The stored row with an edit laid over it — what the server validates. The
 * edit forms send their phone as `phone`; the row keeps it as `phone_number`.
 */
export const memberRowAfterUpdate = (stored = {}, update = {}) => {
  const { phone, ...rest } = update;
  return {
    ...(stored ?? {}),
    ...rest,
    ...(phone !== undefined ? { phone_number: phone } : {}),
  };
};

const CONTACT_KEYS = ["email", "phone", "phone_number", "minor", "parent_guardian_email"];

/**
 * Field-keyed messages for an edit the server would refuse with 400, keyed by
 * the edit forms' field names (`phone`, not `phone_number`). An update that
 * sends none of the contact fields is not checked, as the server does not.
 */
export const memberEditContactErrors = (
  stored,
  update = {},
  { representativeLabel = "Guardian" } = {}
) => {
  if (!CONTACT_KEYS.some((key) => key in update)) return {};
  return missingToFormErrors(
    memberContactMissing(memberRowAfterUpdate(stored, update)),
    representativeLabel
  );
};

/**
 * Server field name -> [form field name, message]. The forms call the phone
 * `phone`; the server and the row call it `phone_number`.
 */
const MISSING_FIELDS = {
  email: ["email", () => "Email is required for adults."],
  phone_number: ["phone", () => "Phone is required for adults."],
  parent_guardian_email: [
    "parent_guardian_email",
    (label) => `${label} email is required while the student has no email or phone of their own.`,
  ],
};

function missingToFormErrors(missing, representativeLabel) {
  return Object.fromEntries(
    missing
      .filter((field) => MISSING_FIELDS[field])
      .map((field) => {
        const [formField, message] = MISSING_FIELDS[field];
        return [formField, message(representativeLabel)];
      })
  );
}

/**
 * The fields a members endpoint's 400 says are missing, as form field errors:
 * `{ ok: false, message, missing: [...] }`. `message` is never parsed. The old
 * server sends no `missing`, which reads as nothing to mark.
 */
export const memberServerFieldErrors = (error, { representativeLabel = "Guardian" } = {}) => {
  if (error?.response?.status !== 400) return {};
  const missing = error.response.data?.missing;
  return Array.isArray(missing) ? missingToFormErrors(missing, representativeLabel) : {};
};

/** Members endpoints answer `message`; events answer `msg`. */
export const memberServerErrorMessage = (error, fallback = "An unexpected error occurred.") =>
  error?.response?.data?.message || error?.response?.data?.msg || error?.message || fallback;

/** The messages for a server `missing` list, skipping names it does not know. */
export const missingFieldMessages = (missing, representativeLabel = "Guardian") =>
  Object.values(missingToFormErrors(Array.isArray(missing) ? missing : [], representativeLabel));
