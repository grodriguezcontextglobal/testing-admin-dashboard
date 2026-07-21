/**
 * Pure logic for the Single add-member form: the empty form shape, field
 * validation, and payload construction. Kept out of the component so it can be
 * unit-tested.
 */

/** The pristine form state (company_id is injected by the component). */
export const EMPTY_SINGLE_MEMBER_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address_street: "",
  address_city: "",
  address_state: "",
  address_zip: "",
  grade: "",
  homeroom: "",
  minor: false,
  parent_guardian_first_name: "",
  parent_guardian_last_name: "",
  parent_guardian_email: "",
  parent_guardian_phone_number: "",
};

/**
 * Returns an array of human-readable error strings for the given form.
 * An empty array means the form is valid.
 *
 * The representative label is industry-driven (e.g. "Parent / Guardian" for
 * schools, "Authorized representative" otherwise) so the error copy matches the
 * vocabulary shown in the form. Defaults to "Guardian" for backward
 * compatibility.
 *
 * @param {object} form single-member form values
 * @param {{ representativeLabel?: string }} [options]
 * @returns {string[]} validation errors
 */
export const validateSingleMemberForm = (
  form = {},
  { representativeLabel = "Guardian" } = {}
) => {
  const errs = [];
  if (!form.first_name) errs.push("First name is required.");
  if (!form.last_name) errs.push("Last name is required.");
  if (!form.email) errs.push("Email is required.");
  if (!form.phone) errs.push("Phone is required.");
  if (form.minor) {
    if (!form.parent_guardian_first_name)
      errs.push(`${representativeLabel} first name is required for minors.`);
    if (!form.parent_guardian_last_name)
      errs.push(`${representativeLabel} last name is required for minors.`);
    if (!form.parent_guardian_email)
      errs.push(`${representativeLabel} email is required for minors.`);
    if (!form.parent_guardian_phone_number)
      errs.push(`${representativeLabel} phone number is required for minors.`);
  }
  return errs;
};

/**
 * Builds the request payload, composing the single-line address from parts.
 *
 * @param {object} form single-member form values
 * @returns {object} payload for /db_member/new-member
 */
export const buildSingleMemberPayload = (form = {}) => ({
  ...form,
  address: `${form.address_street}, ${form.address_city}, ${form.address_state} ${form.address_zip}`,
});
