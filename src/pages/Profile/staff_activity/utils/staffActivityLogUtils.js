import { canViewStaffActivity, resolveRoleType } from "../../../../config/roles";

// Per FRONTEND_staff_activity_log.md §1/§2: the free-text `action` values the
// register endpoint documents, plus FORCE_LOGOUT (the one auto-logged action
// mentioned there that isn't in the register list).
export const ACTIVITY_LOG_ACTIONS = [
  "LOGIN",
  "LOGOUT",
  "FORCE_LOGOUT",
  "CREATE",
  "UPDATE",
  "DELETE",
  "ASSIGN",
  "UNASSIGN",
  "IMPORT",
  "EXPORT",
];

const staffFullName = (staff) =>
  [staff?.name, staff?.lastName].filter(Boolean).join(" ").trim() || "Unknown staff";

/**
 * Adapts one raw `GET /api/admin/activity-logs` row into what Body.jsx renders.
 *
 * Who acted is separate from what they did. It used to be one string --
 * "Jane Doe LOGIN AdminUser" -- which read as a sentence but could not be laid
 * out: the trail is read to answer "who did this", and a name with no email
 * does not identify a person in a company with two Janes.
 */
export const mapLogToListItem = (log) => ({
  id: log?.id,
  staffName: staffFullName(log?.staff_member_id),
  /* The populated staff record is the source; `details.email` is the fallback,
     since the register endpoint stamps it on the login rows and it is the same
     person either way. */
  staffEmail:
    String(log?.staff_member_id?.email ?? log?.details?.email ?? "").trim() ||
    null,
  actionTaken: [log?.action, log?.target_model].filter(Boolean).join(" "),
  time: log?.timestamp,
});

const staffId = (staff) => staff?._id ?? staff?.id;

/**
 * B2 read hierarchy: keeps a log row if the viewer authored it (self is always
 * visible) or if canViewStaffActivity allows the viewer's role to see the
 * authoring staff's role. See roles.js for the rank rule.
 *
 * resolveRoleType normalizes the authoring staff's role: backend's populated
 * staff_member_id may carry either the legacy numeric `role` (0-5, same as
 * the /company/search-company employees list) or a `roleType` string.
 */
export const filterLogsByHierarchy = (logs, viewerRoleType, viewerId) => {
  if (!Array.isArray(logs)) return [];
  return logs.filter((log) => {
    const authorId = staffId(log?.staff_member_id);
    if (viewerId && authorId && String(authorId) === String(viewerId)) return true;
    return canViewStaffActivity(viewerRoleType, resolveRoleType(log?.staff_member_id));
  });
};

export const buildActionFilterOptions = () =>
  ACTIVITY_LOG_ACTIONS.map((action) => ({ label: action, value: action }));

/**
 * Same B2 hierarchy applied to the "Users" filter dropdown, so it never offers
 * a staff member whose activity the viewer isn't allowed to see. staffList
 * comes from the same /company/search-company employees array the rest of
 * the Staff pages use, where `role` is the legacy numeric value.
 */
const nameKeys = (staff) => [
  String(staff?.lastName ?? "").trim().toLowerCase(),
  String(staff?.name ?? "").trim().toLowerCase(),
];

/**
 * Last name, then first.
 *
 * The trail is read to answer "who did this", in a company big enough to have
 * two of them: "you have to assume that if you have a school and you have 200
 * employees, that at least two of them is going to have the same last name.
 * Maybe they're related even." Sorting this way puts those two next to each
 * other, where the first name beside the surname is what tells them apart.
 *
 * Someone with no last name recorded sorts under the empty string rather than
 * being dropped — they are still somebody who did something.
 */
const byLastNameThenFirst = (a, b) => {
  const [aLast, aFirst] = nameKeys(a);
  const [bLast, bFirst] = nameKeys(b);
  return aLast === bLast ? aFirst.localeCompare(bFirst) : aLast.localeCompare(bLast);
};

export const buildStaffFilterOptions = (staffList, viewerRoleType, viewerId) => {
  if (!Array.isArray(staffList)) return [];
  return staffList
    .filter((staff) => {
      const id = staffId(staff);
      if (viewerId && id && String(id) === String(viewerId)) return true;
      return canViewStaffActivity(viewerRoleType, resolveRoleType(staff));
    })
    /* Sorted on the records rather than on the built options, so no ordering
       key has to be carried on the option and stripped off again. */
    .sort(byLastNameThenFirst)
    .map((staff) => ({
      label: staffFullName(staff),
      value: staffId(staff),
    }));
};
