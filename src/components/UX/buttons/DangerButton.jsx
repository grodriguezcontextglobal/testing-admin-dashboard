import { Button } from "antd";
// import { useState } from "react";
import "./styles.css";

const DangerButtonComponent = ({
  disabled = false,
  title,
  styles = {},
  buttonType = "button",
  func = null,
  // icon = null,
  loadingState = false,
  titleStyles = {},
  ...props
}) => {
  // const [isHovered, setIsHovered] = useState(false);

  return (
    <Button
      {...props}
      disabled={disabled}
      loading={loadingState}
      htmlType={buttonType}
      onClick={func}
      style={{ ...styles }}
      className="customized__dangerButton"
    >
      <p className="customized__dangerButtonText" style={{ ...titleStyles }}>
        {/* {icon && icon}  */}
        {title}
      </p>
    </Button>
  );
};

export default DangerButtonComponent;
