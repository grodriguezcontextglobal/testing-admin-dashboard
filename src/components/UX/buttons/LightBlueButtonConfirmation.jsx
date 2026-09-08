import ConfirmationButton from "./ConfirmationButton";
/* The file is spelled `LigthBlueButton`. This used to import the correct
   spelling, which does not exist, so the module threw on import. */
import LightBlueButtonComponent from "./LigthBlueButton";

/** Tertiary action, confirmed. */
const LightBlueButtonConfirmationComponent = (props) => (
  <ConfirmationButton ButtonComponent={LightBlueButtonComponent} {...props} />
);

export default LightBlueButtonConfirmationComponent;
