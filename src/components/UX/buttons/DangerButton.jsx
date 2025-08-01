import { Button } from "antd";
import "./styles.css"

const DangerButtonComponent = ({
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
      className="dangerButton"
    >
      <p className="dangerButtonText" style={{ ...titleStyles }}>
        {icon && icon} {title}
      </p>
    </Button>
  );
};

export default DangerButtonComponent;
