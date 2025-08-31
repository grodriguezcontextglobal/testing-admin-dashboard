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
      className="customized__grayButton"
    >
      <p className="customized__grayButtonText" style={{ ...titleStyles }}>
        {icon && icon} {title}
      </p>
    </Button>
  );
};

export default GrayButtonComponent;
