import BlueButtonComponent from "./BlueButton";
import ConfirmationButton from "./ConfirmationButton";

/**
 * Primary action, confirmed. See ConfirmationButton for what the four copies of
 * this file each got wrong before they were folded into one.
 */
const BlueButtonConfirmationComponent = (props) => (
  <ConfirmationButton ButtonComponent={BlueButtonComponent} {...props} />
);

export default BlueButtonConfirmationComponent;
