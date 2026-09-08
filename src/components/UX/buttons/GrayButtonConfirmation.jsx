import ConfirmationButton from "./ConfirmationButton";
import GrayButtonComponent from "./GrayButton";

/** Secondary action, confirmed. */
const GrayButtonConfirmationComponent = (props) => (
  <ConfirmationButton ButtonComponent={GrayButtonComponent} {...props} />
);

export default GrayButtonConfirmationComponent;
