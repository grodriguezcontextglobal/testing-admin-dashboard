import ConfirmationButton from "./ConfirmationButton";
import DangerButtonComponent from "./DangerButton";

/**
 * Destructive action, confirmed.
 *
 * This is the one that was most broken: no wrapper element for Popconfirm to
 * anchor to, `placement="center"` (not an antd placement), and its
 * disabled/loading gate commented out. The confirm button is destructive too,
 * unless the caller says otherwise.
 */
const DangerButtonConfirmationComponent = ({ okButtonProps, ...props }) => (
  <ConfirmationButton
    ButtonComponent={DangerButtonComponent}
    okButtonProps={{ danger: true, ...okButtonProps }}
    {...props}
  />
);

export default DangerButtonConfirmationComponent;
