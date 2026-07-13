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

/** Invitation URL sent through /nodemailer/new_invitation. */
export const buildInvitationLink = ({
  name,
  lastName,
  email,
  company,
  companyId,
  role,
  roleType,
}) =>
  `https://admin.devitrak.net/invitation?first=${encodeURIComponent(name)}&last=${encodeURIComponent(lastName)}&email=${encodeURIComponent(email)}&question=${encodeURIComponent("company name")}&answer=${encodeURIComponent(company)}&role=${encodeURIComponent(role)}&roleType=${encodeURIComponent(roleType)}&company=${encodeURIComponent(companyId)}`;

export const newStaffSchema = yup.object().shape({
  email: yup.string().email("Email format is not valid").required("Email is required"),
  role: yup.number().required("Role is required"),
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
