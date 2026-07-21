import { Modal } from "antd";
import { Subtitle } from "../../../../styles/global/Subtitle";
import FeedbackEvent from "../../../../components/notification/email/FeedbackEvent";
import { useState } from "react";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";

const FeedbackModal = ({ feedbackEventModal, setFeedbackEventModal }) => {
  const [triggerFeedbackEvent, setTriggerFeedbackEvent] = useState(false);
  const closeModal = () => {
    setFeedbackEventModal(false);
  };

  return (
    <Modal
      open={feedbackEventModal}
      centered
      maskClosable={false}
      footer={[
        <div
          key={"footer"}
          style={{
            display: "flex",
            justifyContent: "flex-end",
            width: "100%",
            gap: "10px",
          }}
        >
          <GrayButtonComponent
            key="back"
            buttonType="reset"
            onClick={closeModal}
          >
            Cancel
          </GrayButtonComponent>

          <BlueButtonComponent
            key="submit"
            buttonType="button"
            onClick={() => setTriggerFeedbackEvent(true)}
          >
            Continue
          </BlueButtonComponent>
        </div>,
      ]}
      closeIcon={<p style={{ display: "none" }}>x</p>}
      style={{ zIndex: 30 }}
    >
      <h1 style={Subtitle}>
        You are about to request feedback via email to all consumers who
        attended this event.
      </h1>
      <br />
      <p style={Subtitle}>Do you want to continue?</p>
      {triggerFeedbackEvent && (
        <FeedbackEvent setFeedbackEventModal={setFeedbackEventModal} />
      )}
    </Modal>
  );
};

export default FeedbackModal;
