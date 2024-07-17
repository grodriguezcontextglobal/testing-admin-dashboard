import { Card } from "antd";
import {
  AlarmIcon,
  WhiteCirclePlusIcon,
} from "../../../components/icons/Icons";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../styles/global/GrayButton";
import GrayButtonText from "../../../styles/global/GrayButtonText";
import { CardStyle } from "../../../styles/global/CardStyle";
import { useState } from "react";
import SingleEmailNotification from "../../../components/notification/email/SingleEmail";
import ModalAssignDeviceToConsumer from "../action/ModalAssignDeviceToConsumer";

const CardActionsButton = () => {
  const [notificationActivation, setNotificationActivation] = useState(false);
  const [assignDevice, setAssignDevice] = useState(false);
  return (
    <>
      <Card
        style={{ ...CardStyle, alignSelf: "flex-start", width: "100%" }}
        styles={{
          body: {
            padding: "10px 0 10px 10px",
          },
        }}
      >
        <div style={{ width: "100%", alignSelf: "stretch" }}>
          <button
            onClick={() => setAssignDevice(true)}
            style={{
              ...BlueButton,
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "0 0 12.5px 0",
            }}
          >
            <WhiteCirclePlusIcon />
            &nbsp;
            <p style={{ ...BlueButtonText, textAlign: "center" }}>
              Assign more devices
            </p>
          </button>
          <button
            onClick={() => setNotificationActivation(true)}
            style={{
              ...GrayButton,
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "0",
            }}
          >
            <AlarmIcon />
            &nbsp;
            <p style={{ ...GrayButtonText, textAlign: "center" }}>
              Send notification to return
            </p>
          </button>
        </div>
      </Card>
      {notificationActivation && (
        <SingleEmailNotification
          customizedEmailNotificationModal={notificationActivation}
          setCustomizedEmailNotificationModal={setNotificationActivation}
        />
      )}
      {assignDevice && <ModalAssignDeviceToConsumer assignDevice={assignDevice} setAssignDevice={setAssignDevice}/>}
    </>
  );
};

export default CardActionsButton;
