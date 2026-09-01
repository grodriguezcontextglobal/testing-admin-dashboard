import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import DangerButtonConfirmationComponent from "../../../../components/UX/buttons/DangerButtonConfirmation";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import GrayButtonConfirmationComponent from "../../../../components/UX/buttons/GrayButtonConfirmation";
import { staffProfileActionList } from "../utils/staffProfileActionList";

/**
 * Everything you can *do* to a staff member, in the identity card's action rail.
 *
 * These were the page's navigation once: six verbs in a pill bar next to a
 * "Home" tab, so six actions looked like six places and clicking one replaced
 * the profile with a form. They moved to the rail — a tab is a place, an action
 * is a button.
 *
 * They then spent a while collapsed behind a "Manage" dropdown, which is the
 * difference this rebuild removes: the member profile lists its actions flat,
 * this one hid all but two, and the two pages read as two products. The order
 * and the labels now come from `staffProfileActionList`, which is written to be
 * compared with the member rail rather than guessed at.
 *
 * Access is the one destructive action here, so it is a confirmation button
 * rather than what it used to be: a `NavLink` with a mutation on its `onClick`,
 * which navigated *and* wrote, with nothing to confirm and no way to cancel.
 * It sits last, where the member rail keeps "Delete".
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

  const actions = staffProfileActionList({
    assignDevices: canAssignDevices,
    editDetails: canEditDetails,
    assignEvent: canAssignEvent,
    assignLocation: canAssignLocation,
    changeRole: canChangeRole,
    updateContact: canUpdateContact,
    resetPassword: canResetPassword,
  });

  const run = (action) =>
    action.route
      ? navigate(`/staff/${staffId}/${action.route}`)
      : onEditDetails?.();

  return (
    <>
      {actions.map((action) => {
        const Button =
          action.tone === "primary" ? BlueButtonComponent : GrayButtonComponent;
        return (
          <Button
            key={action.key}
            title={action.label}
            buttonType="button"
            func={() => run(action)}
          />
        );
      })}

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
