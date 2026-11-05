import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import { message } from "antd";

/**
 * Mounting this component sends the event's feedback email, once, then
 * closes the modal. It used to send from inside useMemo, during render, where
 * React may run it more than once.
 */
const FeedbackEvent = ({ setFeedbackEventModal }) => {
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
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
          message.success("Feedback email sent");
          return setFeedbackEventModal(false);
        }
      } catch (error) {
        message.error("Something went wrong. Please try again.");
        return setFeedbackEventModal(false);
      }
    };
    handleSubmitEmailNotification();
  }, [event, user, setFeedbackEventModal]);

  return null;
};

export default FeedbackEvent;
