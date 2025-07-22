import { Button } from "antd";
import "./styles.css"

const GrayButtonComponent = ({
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
      className="grayButton"
    >
      <p className="grayButtonText" style={{ ...titleStyles }}>
        {icon && icon} {title}
      </p>
    </Button>
  );
};

export default GrayButtonComponent;
