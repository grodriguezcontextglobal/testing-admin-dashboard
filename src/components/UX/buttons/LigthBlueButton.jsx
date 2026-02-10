import { Button } from "antd";
// import { useState } from "react";
import "./styles.css";

const LightBlueButtonComponent = ({
  disabled = false,
  title,
  styles = {},
  buttonType = "button",
  func = null,
  // icon = null,
  loadingState = false,
  titleStyles = {},
}) => {
  // const [isHovered, setIsHovered] = useState(false);

  return (
    <Button
      disabled={disabled}
      loading={loadingState}
      htmlType={buttonType}
      onClick={func}
      style={{ ...styles }}
      solid={true}
      className="customized__lightBlueButton"
    >
      <p className="customized__lightBlueButtonText" style={{ ...titleStyles }}>
        {/* {icon && icon}  */}
        {title}
      </p>
    </Button>
  );
};

export default LightBlueButtonComponent;
