/**
 * What you can do to a staff member, in the order the rail shows it.
 *
 * This list exists as data so it can be read beside the member profile's rail
 * (`memberDetailsDashboard/Header.jsx`) and kept in step with it. The two
 * pages are one product and used to disagree about it:
 *
 *   - staff said "Assign a device", the member page said "Assign devices"
 *   - staff hid five of its six actions behind a "Manage" dropdown, so the
 *     same kind of action was one click away on one page and three on the
 *     other
 *
 * Both are drift, and both are fixed here. What stays different is what the
 * two audiences genuinely do not share: a member can be deleted and emailed a
 * reminder, a staff member has their access granted or removed and their role
 * changed. Those are not the same action wearing two labels.
 *
 * Shape of an entry:
 *   key    stable id, also the test id
 *   label  what the button says
 *   tone   "primary" for the one blue button, "secondary" for the rest
 *   route  the /staff/:id/<route> it opens, or null when the caller handles it
 */

/** The one action that is not navigation: it opens a modal in place. */
export const EDIT_DETAILS = "edit-details";

/**
 * The rail for one staff member, already filtered by what the viewer may do.
 *
 * Permission flags come in resolved rather than being read here: several of
 * them also depend on whose profile it is (you may update your own contact
 * details but not your own role), and that pairing belongs with the page that
 * knows both facts.
 *
 * @param {object} can
 * @param {boolean} [can.assignDevices]
 * @param {boolean} [can.editDetails]
 * @param {boolean} [can.assignEvent]
 * @param {boolean} [can.assignLocation]
 * @param {boolean} [can.changeRole]
 * @param {boolean} [can.updateContact]
 * @param {boolean} [can.resetPassword]
 * @returns {Array<{key: string, label: string, tone: string, route: string|null}>}
 */
export const staffProfileActionList = ({
  assignDevices = false,
  editDetails = false,
  assignEvent = false,
  assignLocation = false,
  changeRole = false,
  updateContact = false,
  resetPassword = false,
} = {}) =>
  [
    assignDevices && {
      key: "assign-devices",
      label: "Assign devices",
      tone: "primary",
      route: "assignment",
    },
    editDetails && {
      key: EDIT_DETAILS,
      label: "Edit details",
      tone: "secondary",
      route: null,
    },
    assignEvent && {
      key: "assign-event",
      label: "Assign to an event",
      tone: "secondary",
      route: "assign-staff-events",
    },
    assignLocation && {
      key: "assign-location",
      label: "Locations & permissions",
      tone: "secondary",
      route: "assign-location-manager",
    },
    changeRole && {
      key: "change-role",
      label: "Change role",
      tone: "secondary",
      route: "update-role-company",
    },
    updateContact && {
      key: "update-contact",
      label: "Update contact info",
      tone: "secondary",
      route: "update-contact-info",
    },
    resetPassword && {
      key: "reset-password",
      label: "Send password reset email",
      tone: "secondary",
      route: "reset-password-link",
    },
  ].filter(Boolean);
