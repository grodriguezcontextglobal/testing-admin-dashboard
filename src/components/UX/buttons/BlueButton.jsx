import { Button } from "antd";
import { useState } from "react";
import "./styles.css"

const BlueButtonComponent = ({
  disabled = false,
  title,
  styles = {},
  buttonType = "button",
  func = null,
  icon = null,
  loadingState = false,
  titleStyles = {},
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Clone the icon with hover props if it exists
  const iconWithHover = icon && typeof icon === 'object' && icon.type ? 
    { ...icon, props: { ...icon.props, isHovered, hoverStroke: "#155eef" } } : 
    icon;

  return (
    <Button
      {...props}
      disabled={disabled}
      loading={loadingState}
      htmlType={buttonType}
      onClick={func}
      style={{ ...styles }}
      className="customized__blueButton"
      solid={true}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <p className="customized__blueButtonText" style={{ ...titleStyles }}>
        {iconWithHover && iconWithHover} {title}
      </p>
    </Button>
  );
};

export default BlueButtonComponent;
