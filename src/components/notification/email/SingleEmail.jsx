import PropTypes from "prop-types";
import { useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import "../../../styles/global/actionForm.css";
import BlueButtonComponent from "../../UX/buttons/BlueButton";
import GrayButtonComponent from "../../UX/buttons/GrayButton";
import Input from "../../UX/inputs/Input";
import Label from "../../UX/inputs/Label";
import TextArea from "../../UX/inputs/TextArea";
import ModalUX from "../../UX/modal/ModalUX";
import { useStatusNotification } from "../alerts/useStatusNotification";
import {
  MESSAGE_MAX_LENGTH,
  buildSingleEmailPayload,
  describeEventContext,
  describeRecipient,
  singleEmailFieldErrors,
} from "./utils/singleEmailUtils";

/* Four fields' worth of dialog does not need 1000px. */
const MODAL_WIDTH = 560;

/**
 * One email to one consumer.
 *
 * The form was two placeholder-only boxes inside four nested MUI `Grid`s, the
 * inner one `xs={10}` and centred, so a narrow column floated in a wide modal
 * and neither field carried a label — once you had typed, nothing on screen
 * said which box was the subject. It stated "This email will be sent to
 * {customer.email}" in centred grey type, which read "…to undefined." when the
 * consumer had no address on record.
 *
 * Behaviour fixed along the way, all of it about outbound mail:
 *
 *  - No loading state and no disabled button, so a second click on Send sent a
 *    second email. It is disabled while in flight now.
 *  - No try/catch and no `else` on `if (resp.data.ok)`. A rejected request was
 *    an unhandled rejection and a 500 did nothing at all — the modal stayed
 *    open, said nothing, and the natural next move was to press Send again.
 *  - `{...register("message")}` was spread onto an antd TextArea and then had
 *    its `onChange` overwritten by the component's own, so react-hook-form
 *    never held the message; `setValue("message", "")` cleared a field that did
 *    not exist and the body survived a reopen.
 *  - `event.eventInfoDetail.eventName` was read unguarded, but this modal also
 *    opens from the consumer list, where no event need be in context.
 *  - The 500-character cap was enforced silently by antd. It is stated.
 *
 * What it sends is unchanged: the body comes from buildSingleEmailPayload and
 * is pinned by a test.
 */
const SingleEmailNotification = ({
  customizedEmailNotificationModal,
  setCustomizedEmailNotificationModal,
}) => {
  const { customer } = useSelector((state) => state.customer);
  const { event } = useSelector((state) => state.event);
  const { notify, contextHolder } = useStatusNotification();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState("");

  const recipient = describeRecipient(customer);
  const eventContext = describeEventContext(event);
  const fieldErrors = singleEmailFieldErrors({ subject, message });
  const errorFor = (key) => (submitAttempted ? fieldErrors[key] : undefined);
  const remaining = MESSAGE_MAX_LENGTH - message.length;

  const closeModal = () => {
    setSubject("");
    setMessage("");
    setSubmitAttempted(false);
    setFailure("");
    setCustomizedEmailNotificationModal(false);
  };

  const send = async () => {
    setSubmitAttempted(true);
    setFailure("");
    if (Object.keys(fieldErrors).length > 0) return;

    setSending(true);
    try {
      const response = await devitrakApi.post(
        "/nodemailer/single-email-notification",
        buildSingleEmailPayload({ customer, event, subject, message })
      );
      if (!response.data?.ok) {
        setFailure("The email was not queued. Nothing was sent — try again.");
        setSending(false);
        return;
      }
      notify("success", "Email queued", "It will be sent shortly.");
      setSending(false);
      return closeModal();
    } catch (error) {
      setFailure(error.message);
      setSending(false);
    }
  };

  const titleRender = () => (
    <div className="action-form__header">
      <h2 className="action-form__title">Send an email</h2>
    </div>
  );

  const bodyModal = () => (
    <div className="action-form">
      {contextHolder}

      {recipient.canSend ? (
        <p className="action-form__banner action-form__banner--info">
          Goes to{" "}
          <strong>
            {recipient.name ? `${recipient.name}, ` : ""}
            {recipient.email}
          </strong>
          {eventContext
            ? `, and mentions ${eventContext.name}.`
            : ". No event is in context, so the email will not reference one."}
        </p>
      ) : (
        <p className="action-form__banner action-form__banner--critical">
          This consumer has no email address on record, so there is nothing to
          send to. Add one from their details first.
        </p>
      )}

      <div className="action-form__grid">
        <div className="action-form__field action-form__field--wide">
          <Label htmlFor="email-subject" required>Subject</Label>
          <Input
            id="email-subject"
            value={subject}
            onChange={(domEvent) => setSubject(domEvent.target.value)}
            placeholder="What the email is about"
            disabled={sending || !recipient.canSend}
            error={Boolean(errorFor("subject"))}
          />
          {errorFor("subject") && (
            <p className="action-form__feedback action-form__feedback--error">
              {errorFor("subject")}
            </p>
          )}
        </div>

        <div className="action-form__field action-form__field--wide">
          <Label htmlFor="email-message" required>Message</Label>
          <TextArea
            id="email-message"
            value={message}
            onChange={(domEvent) => setMessage(domEvent.target.value)}
            placeholder="Write the email here."
            disabled={sending || !recipient.canSend}
            error={Boolean(errorFor("message"))}
            textAreaProps={{ rows: 6, style: { resize: "none" } }}
          />
          {errorFor("message") ? (
            <p className="action-form__feedback action-form__feedback--error">
              {errorFor("message")}
            </p>
          ) : (
            <p className="action-form__step-note">
              {remaining} of {MESSAGE_MAX_LENGTH} characters left.
            </p>
          )}
        </div>
      </div>

      {failure && <p className="action-form__notice">{failure}</p>}

      <div className="action-form__footer">
        <p className="action-form__consequence">
          The email is queued as soon as you send it, and cannot be recalled.
        </p>
        <GrayButtonComponent
          title="Cancel"
          buttonType="button"
          func={closeModal}
          isDisabled={sending}
        />
        <BlueButtonComponent
          title="Send email"
          buttonType="button"
          func={send}
          isDisabled={sending || !recipient.canSend}
          isLoading={sending}
        />
      </div>
    </div>
  );

  return (
    <ModalUX
      title={titleRender()}
      body={bodyModal()}
      openDialog={customizedEmailNotificationModal}
      modalStyles={{ zIndex: 30 }}
      closeModal={closeModal}
      width={MODAL_WIDTH}
    />
  );
};

SingleEmailNotification.propTypes = {
  customizedEmailNotificationModal: PropTypes.bool.isRequired,
  setCustomizedEmailNotificationModal: PropTypes.func.isRequired,
};

export default SingleEmailNotification;
