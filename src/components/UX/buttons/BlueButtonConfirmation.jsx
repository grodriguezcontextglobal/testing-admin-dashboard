import { Button, Popconfirm } from "antd";
import "./styles.css";

const BlueButtonConfirmationComponent = ({
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
        className="customized__blueButton"
      >
        <p className="customized__blueButtonText" style={{ ...titleStyles }}>
          {icon && icon} {title}
        </p>
      </Button>
    </Popconfirm>
  );
};

export default BlueButtonConfirmationComponent;
