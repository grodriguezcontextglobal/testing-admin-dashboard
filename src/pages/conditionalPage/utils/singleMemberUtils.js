/**
 * Pure logic for the Single add-member form: the empty form shape, field
 * validation, and payload construction. Kept out of the component so it can be
 * unit-tested.
 */

import { calculateStudentAgeFlags } from "./ageCalculationUtils";

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
  date_of_birth: "",
  minor: false,
  parent_guardian_first_name: "",
  parent_guardian_last_name: "",
  parent_guardian_email: "",
  parent_guardian_phone_number: "",
  relationship: "guardian",
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
 * Minor status is calculated from date_of_birth — no manual checkbox.
 *
 * @param {object} form single-member form values
 * @param {{ representativeLabel?: string, requireDob?: boolean }} [options]
 * @returns {string[]} validation errors
 */
export const validateSingleMemberForm = (form = {}, options = {}) =>
  Object.values(singleMemberFieldErrors(form, options));

/**
 * The same validation keyed by the field it belongs to, so the form can mark
 * the input instead of printing a list of sentences at the bottom of a
 * two-column grid and leaving you to find the field it means.
 *
 * `validateSingleMemberForm` is this object's values, in insertion order — one
 * source of truth for both shapes.
 *
 * @param {object} form single-member form values
 * @param {{ representativeLabel?: string, requireDob?: boolean }} [options]
 * @returns {Record<string, string>} field name -> error message
 */
export const singleMemberFieldErrors = (
  form = {},
  { representativeLabel = "Guardian", requireDob = false } = {}
) => {
  const errs = {};
  if (!form.first_name) errs.first_name = "First name is required.";
  if (!form.last_name) errs.last_name = "Last name is required.";
  if (!form.email) errs.email = "Email is required.";
  if (!form.phone) errs.phone = "Phone is required.";
  if (requireDob && !form.date_of_birth)
    errs.date_of_birth = "Date of birth is required.";

  const { minor } = calculateStudentAgeFlags(form.date_of_birth);
  if (minor) {
    if (!form.parent_guardian_first_name)
      errs.parent_guardian_first_name = `${representativeLabel} first name is required for minors.`;
    if (!form.parent_guardian_last_name)
      errs.parent_guardian_last_name = `${representativeLabel} last name is required for minors.`;
    if (!form.parent_guardian_email)
      errs.parent_guardian_email = `${representativeLabel} email is required for minors.`;
    if (!form.parent_guardian_phone_number)
      errs.parent_guardian_phone_number = `${representativeLabel} phone number is required for minors.`;
  }
  return errs;
};

/**
 * Builds the request payload, composing the single-line address from parts
 * and deriving minor/under_13 flags from date_of_birth.
 *
 * @param {object} form single-member form values
 * @returns {object} payload for /db_member/new-member
 */
export const buildSingleMemberPayload = (form = {}) => {
  const { minor, under_13 } = calculateStudentAgeFlags(form.date_of_birth);
  return {
    ...form,
    minor,
    under_13,
    address: `${form.address_street}, ${form.address_city}, ${form.address_state} ${form.address_zip}`,
  };
};
