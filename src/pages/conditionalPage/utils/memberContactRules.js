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
