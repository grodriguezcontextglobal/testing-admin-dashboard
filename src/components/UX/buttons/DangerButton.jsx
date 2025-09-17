import { Button } from "antd";
import { useState } from "react";
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
  const [isHovered, setIsHovered] = useState(false);

  // Clone the icon with hover props if it exists
  const iconWithHover = icon && typeof icon === 'object' && icon.type ? 
    { ...icon, props: { ...icon.props, isHovered, hoverStroke: "var(--danger-action)" } } : 
    icon;

  return (
    <Button
      disabled={disabled}
      loading={loadingState}
      htmlType={buttonType}
      onClick={func}
      style={{ ...styles }}
      className="customized__dangerButton"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <p className="customized__dangerButtonText" style={{ ...titleStyles }}>
        {iconWithHover && iconWithHover} {title}
      </p>
    </Button>
  );
};

export default DangerButtonComponent;
