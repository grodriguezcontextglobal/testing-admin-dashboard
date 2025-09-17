import { Button } from "antd";
import { useState } from "react";
import "./styles.css";

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
  const [isHovered, setIsHovered] = useState(false);

  const iconWithHover =
    icon && typeof icon.type === "function"
      ? { ...icon, props: { ...icon.props, isHovered, hoverStroke: "#fff" } }
      : icon;

  return (
    <Button
      disabled={disabled}
      loading={loadingState}
      htmlType={buttonType}
      onClick={func}
      style={{ ...styles }}
      solid={true}
      className="customized__lightBlueButton"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <p className="customized__lightBlueButtonText" style={{ ...titleStyles }}>
        {iconWithHover && iconWithHover} {title}
      </p>
    </Button>
  );
};

export default LightBlueButtonComponent;
