import { useMemo } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import { message } from "antd";

const FeedbackEvent = ({ setFeedbackEventModal }) => {
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const handleSubmitEmailNotification = async () => {
    try {
      const emailNotificationProfile = {
        eventID: event.id,
        eventSelected: event.eventInfoDetail.eventName,
        company: event.company,
        companyId: user.companyData.id,
      };
      const resp = await devitrakApi.post(
        "/nodemailer/feedback-email-notification",
        emailNotificationProfile
      );
      if (resp.data.ok) {
        message.success("Email sent successfully");
        return setFeedbackEventModal(false);
      }
    } catch (error) {
      message.error("Something went wrong. Please try again.");
      return setFeedbackEventModal(false);
    }
  };

  useMemo(() => {
    handleSubmitEmailNotification();
    return;
  }, []);
};

export default FeedbackEvent;
