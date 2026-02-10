import { Popconfirm } from "antd";
// import { useState } from "react";
import "./styles.css";
import BlueButtonComponent from "./BlueButton";

const BlueButtonConfirmationComponent = ({
  disabled = false,
  title,
  styles = {},
  buttonType = "button",
  func = null,
  // icon = null,
  loadingState = false,
  titleStyles = {},
  confirmationTitle = "Are you sure?",
}) => {
  // // const [isHovered, setIsHovered] = useState(false);

  return (
    <Popconfirm title={confirmationTitle} onConfirm={func}>
      <BlueButtonComponent
        disabled={disabled}
        loadingState={loadingState}
        buttonType={buttonType}
        styles={styles}
        title={title}
        titleStyles={titleStyles}
      />
    </Popconfirm>
  );
};

export default BlueButtonConfirmationComponent;
