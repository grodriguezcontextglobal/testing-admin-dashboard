import { Button, Popconfirm } from "antd";
import { useState } from "react";
import "./styles.css";

const DangerButtonConfirmationComponent = ({
  disabled = false,
  title,
  styles = {},
  buttonType = "button",
  func = null,
  icon = null,
  loadingState = false,
  titleStyles = {},
  confirmationTitle = "Are you sure?",
  hoverStroke = "#dc2626",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const iconWithHover = icon && typeof icon.type === 'function' 
    ? { ...icon, props: { ...icon.props, isHovered, hoverStroke } }
    : icon;

  return (
    <Popconfirm title={confirmationTitle} onConfirm={func}>
      <Button
        disabled={disabled}
        loading={loadingState}
        htmlType={buttonType}
        style={{ ...styles }}
        className="customized__dangerButton"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <p className="customized__dangerButtonText" style={{ ...titleStyles }}>
          {iconWithHover && iconWithHover} {title}
        </p>
      </Button>
    </Popconfirm>
  );
};

export default DangerButtonConfirmationComponent;
