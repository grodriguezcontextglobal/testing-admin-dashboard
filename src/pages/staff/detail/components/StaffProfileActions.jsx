import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import DangerButtonConfirmationComponent from "../../../../components/UX/buttons/DangerButtonConfirmation";
import GrayButtonConfirmationComponent from "../../../../components/UX/buttons/GrayButtonConfirmation";
import Dropdown from "../../../../components/UX/dropdown/DropDownComponent";

/**
 * Everything you can *do* to a staff member, in the identity card's action rail.
 *
 * These six were the page's navigation. They sat in a pill bar next to a "Home"
 * tab — "Assign devices", "Assign user to event", "Assign Location/Permission",
 * "Update contact info", "Change role", "Send password reset email" — so six
 * verbs looked like six places, and clicking one replaced the profile with a
 * form. The shared profile shell says it plainly: a tab is a place, and a
 * one-shot action in a nav bar makes people believe they have arrived somewhere.
 *
 * Access is the one destructive action here, so it is a confirmation button
 * rather than what it used to be: a `NavLink` with a mutation on its `onClick`,
 * which navigated *and* wrote, with nothing to confirm and no way to cancel.
 */
const StaffProfileActions = ({
  staffId,
  canAssignDevices,
  canAssignEvent,
  canAssignLocation,
  canChangeRole,
  canUpdateContact,
  canResetPassword,
  canEditDetails,
  onEditDetails,
  accessToggle,
}) => {
  const navigate = useNavigate();
  const go = (route) => navigate(`/staff/${staffId}/${route}`);

  const manageOptions = [
    canEditDetails && {
      label: "Edit details",
      value: "__edit-details",
    },
    canAssignEvent && {
      label: "Assign to an event",
      value: "assign-staff-events",
    },
    canAssignLocation && {
      label: "Locations & permissions",
      value: "assign-location-manager",
    },
    canChangeRole && { label: "Change role", value: "update-role-company" },
    canUpdateContact && {
      label: "Update contact info",
      value: "update-contact-info",
    },
    canResetPassword && {
      label: "Send password reset email",
      value: "reset-password-link",
    },
  ].filter(Boolean);

  return (
    <>
      {canAssignDevices && (
        <BlueButtonComponent
          title="Assign a device"
          buttonType="button"
          func={() => go("assignment")}
        />
      )}

      {manageOptions.length > 0 && (
        <Dropdown
          label="Manage"
          variant="outline"
          options={manageOptions}
          onChange={(route) =>
            route === "__edit-details" ? onEditDetails?.() : go(route)
          }
          placement="bottom-end"
          menuWidth={240}
        />
      )}

      {accessToggle &&
        (accessToggle.isActive ? (
          <DangerButtonConfirmationComponent
            title="Remove access"
            buttonType="button"
            loadingState={accessToggle.isPending}
            confirmationTitle="Remove this person's access?"
            confirmationDescription="They stay on the staff list but cannot sign in or be assigned anything until access is granted again."
            okText="Remove access"
            func={accessToggle.onToggle}
          />
        ) : (
          <GrayButtonConfirmationComponent
            title="Grant access"
            buttonType="button"
            loadingState={accessToggle.isPending}
            confirmationTitle="Grant this person access?"
            confirmationDescription="They will be able to sign in with the role shown above."
            okText="Grant access"
            func={accessToggle.onToggle}
          />
        ))}
    </>
  );
};

StaffProfileActions.propTypes = {
  staffId: PropTypes.string,
  canAssignDevices: PropTypes.bool,
  canAssignEvent: PropTypes.bool,
  canAssignLocation: PropTypes.bool,
  canChangeRole: PropTypes.bool,
  canUpdateContact: PropTypes.bool,
  canResetPassword: PropTypes.bool,
  /** Name, email, phone and photo — a modal, not a route. */
  canEditDetails: PropTypes.bool,
  onEditDetails: PropTypes.func,
  /** `null` when the viewer may not change access, or on their own profile. */
  accessToggle: PropTypes.shape({
    isActive: PropTypes.bool,
    isPending: PropTypes.bool,
    onToggle: PropTypes.func,
  }),
};

export default StaffProfileActions;
