import * as yup from "yup";
import { LEGACY_ROLE_MAP, ROLE_LABELS } from "../../../../config/roles";

/**
 * Pure logic for NewStaffMember — role option filtering, the company employee
 * entry, the invitation link, and the conditional validation schema.
 */

export const ALL_ROLE_OPTIONS = [
  { label: ROLE_LABELS.root_admin, value: 0 },
  { label: ROLE_LABELS.admin, value: 1 },
  { label: ROLE_LABELS.sale_manager, value: 2 },
  { label: ROLE_LABELS.event_manager, value: 3 },
  { label: ROLE_LABELS.inventory_manager, value: 4 },
  { label: ROLE_LABELS.assistant, value: 5 },
];

/** root_admin (level 0) sees everything; others can only create lower roles. */
export const buildRoleOptions = (userLevel, allOptions = ALL_ROLE_OPTIONS) =>
  userLevel === 0 ? allOptions : allOptions.filter((o) => o.value > userLevel);

export const roleTypeFromRole = (role) =>
  LEGACY_ROLE_MAP[Number(role)] ?? "assistant";

/**
 * What each role actually grants, read off the PERMISSIONS matrix in
 * config/roles.js.
 *
 * The picker used to offer six bare labels. Choosing a role for a new hire is
 * the one decision in this form that is hard to undo from here — it is written
 * into Company.employees and then into company_staff when the invitation is
 * accepted — and the form said nothing about what any of them meant.
 */
export const ROLE_HINTS = {
  root_admin: "Full access, including billing and the subscription.",
  admin: "Full access to staff, inventory, events and consumers. No billing.",
  sale_manager:
    "Read and update inventory and events. No staff, no locations, no deleting.",
  event_manager:
    "Full events, consumers, transactions and members, plus posts. No inventory.",
  inventory_manager:
    "Full inventory and locations, plus posts. No events or consumers.",
  assistant:
    "Create, read and update events, consumers and members. Cannot delete.",
};

export const roleHintFor = (role) => ROLE_HINTS[roleTypeFromRole(role)];

const normalizeEmail = (value) => String(value ?? "").trim().toLowerCase();

/**
 * The company's own record for this email, if it already has one.
 *
 * The modal held the employee list (it needs it to append to) and never looked
 * at it, so inviting someone already on the staff appended a second entry for
 * the same person — with whatever role was picked the second time.
 */
export const findCompanyEmployee = (employees, email) => {
  const wanted = normalizeEmail(email);
  if (!wanted) return null;

  const list = Array.isArray(employees) ? employees : [];
  return list.find((entry) => normalizeEmail(entry?.user) === wanted) ?? null;
};

/** Why the email was refused, in the words the staff list itself uses. */
export const existingEmployeeMessage = (entry) => {
  const name = [entry?.firstName, entry?.lastName].filter(Boolean).join(" ");
  const who = name || entry?.user || "This person";
  const role = ROLE_LABELS[entry?.roleType] ?? entry?.roleType;
  const status = entry?.status;

  return [
    `${who} is already on your staff list`,
    role ? ` as ${role}` : "",
    status ? ` (${status})` : "",
    ".",
  ].join("");
};

/** The employee object appended to company.employees. */
export const buildEmployeeEntry = ({ name, lastName, email, role }) => ({
  user: email,
  firstName: name,
  lastName,
  status: "Pending",
  super_user: false,
  role: String(role),
  roleType: roleTypeFromRole(role),
  active: true,
});

/**
 * Invitation URL sent through /nodemailer/new_invitation.
 *
 * Carries identity only. The role is not a parameter: it belongs to the
 * invitation already sitting in Company.employees, and /registration/accept-invitation
 * reads it from there. While it travelled in the query string the invited person
 * could edit the URL — the acceptance route carries no authentication — and ask
 * for roleType=root_admin, which landed verbatim in company_staff. `question`
 * and `answer` are gone too: no flow ever read them, there is no secret-question
 * password recovery, and AdminUser no longer has the fields.
 *
 * `company` stays as the Mongo ObjectId because the landing page resolves the
 * company with it; `company_name` rides along so the page can name the company
 * before that lookup answers.
 */
export const buildInvitationLink = ({
  name,
  lastName,
  email,
  company,
  companyId,
}) =>
  `https://admin.devitrak.net/invitation?first=${encodeURIComponent(name)}&last=${encodeURIComponent(lastName)}&email=${encodeURIComponent(email)}&company=${encodeURIComponent(companyId)}&company_name=${encodeURIComponent(company)}`;

export const newStaffSchema = yup.object().shape({
  // Trimmed before it is validated: a pasted address carries a trailing space
  // often enough, and the form answered that with "Email format is not valid"
  // rather than accepting it. The trimmed value is what reaches
  // Company.employees and the invitation email.
  email: yup
    .string()
    .trim()
    .email("Email format is not valid")
    .required("Email is required"),
  // The picker starts empty. `yup.number()` casts "" to NaN, which fails as a
  // type error ("role must be a `number` type…") instead of the message the
  // field is supposed to show, so an empty select reported a cast problem.
  role: yup
    .number()
    .transform((value, original) => (original === "" ? undefined : value))
    .typeError("Role is required")
    .required("Role is required"),
  name: yup.string().when("$needCreate", {
    is: true,
    then: (s) => s.required("Name is required"),
    otherwise: (s) => s.optional(),
  }),
  lastName: yup.string().when("$needCreate", {
    is: true,
    then: (s) => s.required("Last name is required"),
    otherwise: (s) => s.optional(),
  }),
  phoneNumber: yup.string().when("$needCreate", {
    is: true,
    then: (s) => s.required("Phone number is required"),
    otherwise: (s) => s.optional(),
  }),
});
