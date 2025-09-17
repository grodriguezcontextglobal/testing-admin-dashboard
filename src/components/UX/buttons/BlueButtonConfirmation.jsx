import { Button, Popconfirm } from "antd";
import { useState } from "react";
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
  const [isHovered, setIsHovered] = useState(false);

  // Clone the icon with hover props if it exists
  const iconWithHover = icon && typeof icon === 'object' && icon.type ? 
    { ...icon, props: { ...icon.props, isHovered, hoverStroke: "#155eef" } } : 
    icon;

  return (
    <Popconfirm title={confirmationTitle} onConfirm={func}>
      <Button
        disabled={disabled}
        loading={loadingState}
        htmlType={buttonType}
        style={{ ...styles }}
        className="customized__blueButton"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <p className="customized__blueButtonText" style={{ ...titleStyles }}>
          {iconWithHover && iconWithHover} {title}
        </p>
      </Button>
    </Popconfirm>
  );
};

export default BlueButtonConfirmationComponent;
