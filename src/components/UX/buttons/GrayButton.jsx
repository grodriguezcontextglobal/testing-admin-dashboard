import { Button } from "antd";
import { useState } from "react";
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
  hoverStroke = "#344054",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const iconWithHover = icon && typeof icon.type === 'function' 
    ? { ...icon, props: { ...icon.props, isHovered, hoverStroke } }
    : icon;

  return (
    <Button
      disabled={disabled}
      loading={loadingState}
      htmlType={buttonType}
      onClick={func}
      style={{ ...styles }}
      className="customized__grayButton"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <p className="customized__grayButtonText" style={{ ...titleStyles }}>
        {iconWithHover && iconWithHover} {title}
      </p>
    </Button>
  );
};

export default GrayButtonComponent;
