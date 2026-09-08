import { hasPermission } from "../../../../../config/roles";

/**
 * The sections of a member's profile.
 *
 * Sections are places, so they get noun labels. The verbs that used to sit in
 * this bar — "Assign devices", "Send email reminder" — moved to the identity
 * card's action rail, because a one-shot action in a tab bar makes people
 * believe they've navigated somewhere and then wonder how to get back.
 *
 * "Reminders" is here rather than in the rail for the opposite reason: it is a
 * route of its own (`/member/:id/reminders`) with a page behind it, and the
 * rail sits below the fold on this profile — the reminder was there all along
 * and nobody could find it. A noun for a place, a verb for an action; the
 * label is what decides which bar an entry belongs in, not the entry itself.
 */
export const MEMBER_NAV_TABS = Object.freeze([
  { key: "main", label: "Devices", to: "main", permission: "nav:members" },
  {
    key: "details",
    label: "Details",
    to: "update-member-information",
    permission: "member:update",
  },
  {
    key: "reminders",
    label: "Reminders",
    to: "reminders",
    permission: "member:notify",
  },
]);

/**
 * The tabs this role may open, in reading order.
 *
 * Filtering here rather than in the component keeps the permission rule out of
 * the render path and testable on its own: a tab whose page the role cannot
 * open is worse than a missing tab, because it looks like a broken page.
 *
 * @param {string} roleType a canonical roleType, from `resolveRoleType(user)`
 * @returns {Array<{key: string, label: string, to: string, permission: string}>}
 */
export const memberNavTabs = (roleType) =>
  MEMBER_NAV_TABS.filter((tab) => hasPermission(tab.permission, roleType));
