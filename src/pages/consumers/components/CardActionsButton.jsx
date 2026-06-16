import { Divider } from "antd";
import { useState } from "react";
import SingleEmailNotification from "../../../components/notification/email/SingleEmail";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import LightBlueButtonComponent from "../../../components/UX/buttons/LigthBlueButton";
import EditConsumerInfoModal from "./EditCOnsumerInfoModal";
import AssigmentAction from "./AssigmentAction";

const CardActionsButton = ({ refetching }) => {
  const [notificationActivation, setNotificationActivation] = useState(false);
  const [openEditConsumerModal, setOpenEditConsumerModal] = useState(false);

  return (
    <>
      <div
        data-testid="consumer-actions"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          width: "100%",
        }}
      >
        <GrayButtonComponent
          title={"Send notification to customer"}
          size="lg"
          styles={{ width: "100%" }}
          func={() => setNotificationActivation(true)}
        />
        <LightBlueButtonComponent
          title={"Edit"}
          size="lg"
          styles={{ width: "100%" }}
          func={() => setOpenEditConsumerModal(true)}
        />
        <Divider style={{ margin: "4px 0" }} />
        <div style={{ width: "100%" }}>
          <AssigmentAction style={{ width: "100%" }} refetching={refetching} />
        </div>
      </div>

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
