import { Button, Popconfirm } from "antd";
import "./styles.css";

const LightBlueButtonConfirmationComponent = ({
  disabled = false,
  title,
  styles = {},
  buttonType = "button",
  func = null,
  icon = null,
  loadingState = false,
  titleStyles = {},
  confirmationTitle = "Are you sure?",
}) => {
  return (
    <Popconfirm title={confirmationTitle} onConfirm={func}>
      <Button
        disabled={disabled}
        loading={loadingState}
        htmlType={buttonType}
        style={{ ...styles }}
        className="customized__lightBlueButton"
      >
        <p className="customized__lightBlueButtonText" style={{ ...titleStyles }}>
          {icon && icon} {title}
        </p>
      </Button>
    </Popconfirm>
  );
};

export default LightBlueButtonConfirmationComponent;
