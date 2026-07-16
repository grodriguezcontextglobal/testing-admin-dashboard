import { Grid } from "@mui/material";
import { notification } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApiAdmin } from "../../../../../api/devitrakApi";
import TextFontsize18LineHeight28 from "../../../../../styles/global/TextFontSize18LineHeight28";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import ReusableCardWithHeaderAndFooter from "../../../../../components/UX/cards/ReusableCardWithHeaderAndFooter";
import ModalUX from "../../../../../components/UX/modal/ModalUX";
import Input from "../../../../../components/UX/inputs/Input";
import { useMutation } from "@tanstack/react-query";
import ReusableTextArea from "../../../../../components/UX/inputs/TextArea";

/**
 * Push-notification broadcast to everyone attending this event who opted in
 * from the consumer app. This is a separate, additional channel alongside
 * email (EmailNotification.jsx) — it does not replace it. `POST
 * /admin/push/broadcast` doesn't exist on the backend yet (see
 * docs/push-notifications-api.md), so a failure here is expected until that
 * lands; it's still surfaced to the user via the same error notification
 * pattern the email modal uses.
 */
const PushNotificationModal = ({
  sendPushNotificationModal,
  setSendPushNotificationModal,
}) => {
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const [message, setMessage] = useState("");
  const [loadingState, setLoadingState] = useState(false);
  const { register, handleSubmit, setValue } = useForm();
  const closeModal = () => {
    setSendPushNotificationModal(false);
  };
  const onChange = (e) => {
    return setMessage(e.target.value);
  };

  const fetchingNewPushNotification = useMutation({
    mutationFn: async (data) => {
      await devitrakApiAdmin.post("/push/broadcast", data);
    },
    onSuccess: () => {
      setValue("title", "");
      setValue("body", "");
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
        Push notification
      </h3>
    );
  };
  const handleSubmitPushNotification = async (data) => {
    try {
      setLoadingState(true);
      const pushNotificationProfile = {
        eventId: event.id,
        companyId: user.companyData.id,
        title: data.title,
        body: message,
      };
      await fetchingNewPushNotification.mutateAsync(pushNotificationProfile);
    } catch (error) {
      setLoadingState(false);
      openNotificationWithIcon("Error", `${error}`);
    }
  };
  const body = () => {
    return (
      <ReusableCardWithHeaderAndFooter
        title="This will be sent as a push notification to everyone who enabled event announcements for this event."
        actions={[
          <div
            style={{
              width: "fit-content",
              padding: "0 24px",
              display: "flex",
              justifyContent: "center",
            }}
            key="send-push-notification-button"
          >
            <BlueButtonComponent
              form="push-notification-form"
              buttonType="submit"
              title={"Send notification"}
              loadingState={loadingState}
              func={null}
            />
          </div>
        ]}
      >
        <form
          style={{ width: "100%" }}
          onSubmit={handleSubmit(handleSubmitPushNotification)}
          id="push-notification-form"
        >
          <Grid marginY={"0.5rem"} item xs={12}>
            <Input
              required
              placeholder="Notification title."
              fullWidth
              style={{ width: "100%" }}
              {...register("title")}
            />
          </Grid>
          <Grid marginY={"0.5rem"} item xs={12}>
            <ReusableTextArea
              required
              textAreaProps={{
                showCount: true,
                maxLength: 200,
              }}
              {...register("body")}
              onChange={onChange}
              placeholder="Write your notification here."
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
        openDialog={sendPushNotificationModal}
        modalStyles={{ zIndex: 30 }}
        closeModal={closeModal}
      />
    </>
  );
};

export default PushNotificationModal;
