import { Button } from "antd";
import "./styles.css"
// import { BlueButtonText } from "../../../styles/global/BlueButtonText";
// import { BlueButton } from "../../../styles/global/BlueButton";

const BlueButtonComponent = ({
  disabled = false,
  title,
  styles = {},
  buttonType = "button",
  func = null,
  icon = null,
  loadingState = false,
  titleStyles = {},
}) => {
  return (
    <Button
      disabled={disabled}
      loading={loadingState}
      htmlType={buttonType}
      onClick={func}
      style={{ ...styles }}
      className="blueButton"
    >
      <p className="blueButtonText" style={{ ...titleStyles }}>
        {icon && icon} {title}
      </p>
    </Button>
  );
};

export default BlueButtonComponent;
