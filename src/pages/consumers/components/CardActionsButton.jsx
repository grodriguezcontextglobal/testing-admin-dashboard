import { Card } from "antd";
import { useState } from "react";
import { AlarmIcon } from "../../../components/icons/AlarmIcon";
import SingleEmailNotification from "../../../components/notification/email/SingleEmail";
import { CardStyle } from "../../../styles/global/CardStyle";
import { GrayButton } from "../../../styles/global/GrayButton";
import GrayButtonText from "../../../styles/global/GrayButtonText";
import { LightBlueButton } from "../../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../../styles/global/LightBlueButtonText";
import EditConsumerInfoModal from "./EditCOnsumerInfoModal";

const CardActionsButton = () => {
  const [notificationActivation, setNotificationActivation] = useState(false);
  const [openEditConsumerModal, setOpenEditConsumerModal] = useState(false);
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
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            alignSelf: "stretch",
            margin: "1.5dvh 0",
          }}
        >
          <button
            onClick={() => setOpenEditConsumerModal(true)}
            style={{
              ...LightBlueButton,
              width: "fit-content",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "0",
            }}
          >
            <p style={{ ...LightBlueButtonText, textAlign: "center" }}>Edit</p>
          </button>
        </div>
      </Card>
      {notificationActivation && (
        <SingleEmailNotification
          customizedEmailNotificationModal={notificationActivation}
          setCustomizedEmailNotificationModal={setNotificationActivation}
        />
      )}
      {openEditConsumerModal && (
        <EditConsumerInfoModal
          openEditConsumerModal={openEditConsumerModal}
          setOpenEditConsumerModal={setOpenEditConsumerModal}
        />
      )}
    </>
  );
};

export default CardActionsButton;
