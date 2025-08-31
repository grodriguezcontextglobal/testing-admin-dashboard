import { Card } from "antd";
import { useState } from "react";
import SingleEmailNotification from "../../../components/notification/email/SingleEmail";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import LightBlueButtonComponent from "../../../components/UX/buttons/LigthBlueButton";
import { CardStyle } from "../../../styles/global/CardStyle";
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
          <GrayButtonComponent
            title={"Send notification to customer"}
            styles={{ width: "100%" }}
            func={() => setNotificationActivation(true)}
          />
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
          <LightBlueButtonComponent
            title={"Edit"}
            styles={{ width: "100%" }}
            func={() => setOpenEditConsumerModal(true)}
          />
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
