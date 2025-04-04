import { Button, Modal } from "antd";
import { Subtitle } from "../../../../styles/global/Subtitle";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../styles/global/GrayButtonText";
import FeedbackEvent from "../../../../components/notification/email/FeedbackEvent";
import { useState } from "react";

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
          <Button
            key="back"
            htmlType="reset"
            onClick={closeModal}
            style={GrayButton}
          >
            <p style={GrayButtonText}>Cancel</p>
          </Button>

          <Button
            key="submit"
            htmlType="button"
            onClick={() => setTriggerFeedbackEvent(true)}
            style={BlueButton}
          >
            <p style={BlueButtonText}>Continue</p>
          </Button>
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
