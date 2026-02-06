import { Grid } from "@mui/material";
import { notification } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import BlueButtonComponent from "../../UX/buttons/BlueButton";
import ReusableCardWithHeaderAndFooter from "../../UX/cards/ReusableCardWithHeaderAndFooter";
import ModalUX from "../../UX/modal/ModalUX";
import Input from "../../UX/inputs/Input";
import { useMutation } from "@tanstack/react-query";
import ReusableTextArea from "../../UX/inputs/TextArea";

const EmailNotification = ({
  customizedEmailNotificationModal,
  setCustomizedEmailNotificationModal,
}) => {
  const { event } = useSelector((state) => state.event);
  const [message, setMessage] = useState("");
  const [loadingState, setLoadingState] = useState(false);
  const { register, handleSubmit, setValue } = useForm();
  const closeModal = () => {
    setCustomizedEmailNotificationModal(false);
  };
  const onChange = (e) => {
    return setMessage(e.target.value);
  };

  const fetchingNewEmail = useMutation({
    mutationFn: async (data) => {
      await devitrakApi.post(
        "/nodemailer/massive-event-customer-notification",
        data,
      );
    },
    onSuccess: () => {
      setValue("subject", "");
      setValue("message", "");
      setLoadingState(false);
      return setTimeout(() => {
        closeModal();
      }, 2500);
    },
    onError: (error) => {
      setLoadingState(false);
      openNotificationWithIcon("Error", `${error}`);
    },
  });
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (msg, dscpt) => {
    api.open({
      message: msg,
      description: dscpt,
    });
  };
  const renderTitle = () => {
    return (
      <h3
        style={{
          ...TextFontsize18LineHeight28,
          color: "var(--gray-900, #101828)",
        }}
      >
        Email notification
      </h3>
    );
  };
  const handleSubmitEmailNotification = async (data) => {
    try {
      setLoadingState(true);
      const emailNotificationProfile = {
        eventID: event.id,
        subject: data.subject,
        message: message,
        eventSelected: event.eventInfoDetail.eventName,
        company: event.company,
      };
      await fetchingNewEmail.mutateAsync(emailNotificationProfile);
    } catch (error) {
      setLoadingState(false);
      openNotificationWithIcon("Error", `${error}`);
    }
  };
  const body = () => {
    return (
      <ReusableCardWithHeaderAndFooter
        title="This email will be sent to all attendees of this event."
        actions={[
          <div
            style={{
              width: "fit-content",
              padding: "0 24px",
              display: "flex",
              justifyContent: "center",
            }}
            key="send-email-massive-button"
          >
            <BlueButtonComponent
              form="massive-email-notification-form"
              buttonType="submit"
              title={"Send email"}
              loadingState={loadingState}
              func={null}
            />
          </div>
        ]}
      >
        <form
          style={{ width: "100%" }}
          onSubmit={handleSubmit(handleSubmitEmailNotification)}
          id="massive-email-notification-form"
        >
          <Grid marginY={"0.5rem"} item xs={12}>
            <Input
              required
              placeholder="Your email's subject here."
              fullWidth
              style={{ width: "100%" }}
              {...register("subject")}
            />
          </Grid>
          <Grid marginY={"0.5rem"} item xs={12}>
            <ReusableTextArea
              required
              textAreaProps={{
                showCount: true,
                maxLength: 500,
              }}
              {...register("message")}
              onChange={onChange}
              placeholder="Write your email here."
              style={{
                height: 120,
                resize: "none",
                margin: "0 0 0.8rem",
              }}
            />
          </Grid>
        </form>
      </ReusableCardWithHeaderAndFooter>
    );
  };

  return (
    <>
      {contextHolder}
      <ModalUX
        title={renderTitle()}
        body={body()}
        openDialog={customizedEmailNotificationModal}
        modalStyles={{ zIndex: 30 }}
        closeModal={closeModal}
      />
    </>
  );
};

export default EmailNotification;
