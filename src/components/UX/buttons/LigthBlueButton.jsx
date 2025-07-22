import { Button } from "antd";
import "./styles.css"

const LightBlueButtonComponent = ({
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
      className="lightBlueButton"
    >
      <p className="lightBlueButtonText" style={{ ...titleStyles }}>
        {icon && icon} {title}
      </p>
    </Button>
  );
};

export default LightBlueButtonComponent;
