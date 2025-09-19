import { Grid, OutlinedInput, Typography } from "@mui/material";
import { Input, notification } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import BlueButtonComponent from "../../UX/buttons/BlueButton";
import ModalUX from "../../UX/modal/ModalUX";
const { TextArea } = Input;

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

  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (msg, dscpt) => {
    api.open({
      message: msg,
      description: dscpt,
    });
  };
  const renderTitle = () => {
    return (
      <Typography
        textTransform={"none"}
        textAlign={"center"}
        fontWeight={600}
        fontSize={"18px"}
        fontFamily={"Inter"}
        lineHeight={"28px"}
        color={"var(--gray-900, #101828)"}
      >
        Email notification
      </Typography>
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
      const resp = await devitrakApi.post(
        "/nodemailer/massive-event-customer-notification",
        emailNotificationProfile
      );
      if (resp.data.ok) {
        openNotificationWithIcon(
          "Notification sent.",
          `${resp.data.notification}`
        );
        setValue("subject", "");
        setValue("message", "");
        setLoadingState(false);
        return setTimeout(() => {
          closeModal();
        }, 2500);
      }
    } catch (error) {
      setLoadingState(false);
      openNotificationWithIcon("Error", `${error}`);
    }
  };
  const body = () => {
    return (
      <>
        <Grid
          display={"flex"}
          alignItems={"center"}
          justifyContent={"center"}
          margin={"auto"}
          container
        >
          <Grid
            display={"flex"}
            alignItems={"center"}
            justifyContent={"center"}
            textAlign={"center"}
            marginY={"1rem auto"}
            item
            xs={12}
            sm={12}
            md={10}
            lg={10}
          >
            <Typography
              textTransform={"none"}
              textAlign={"center"}
              fontWeight={400}
              fontSize={"14px"}
              fontFamily={"Inter"}
              lineHeight={"20px"}
              color={"var(--gray-600, #475467)"}
            >
              This email will be sent to all attendees of this event.
            </Typography>
          </Grid>
          <Grid
            display={"flex"}
            alignItems={"center"}
            justifyContent={"center"}
            margin={"auto"}
            item
            xs={10}
          >
            <form
              style={{ width: "100%" }}
              onSubmit={handleSubmit(handleSubmitEmailNotification)}
            >
              <Grid marginY={"0.5rem"} item xs={12}>
                <OutlinedInput
                  required
                  placeholder="Your email's subject here."
                  fullWidth
                  style={{ ...OutlinedInputStyle, width: "100%" }}
                  {...register("subject")}
                />
              </Grid>
              <Grid marginY={"0.5rem"} item xs={12}>
                <TextArea
                  required
                  showCount
                  maxLength={500}
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
              <Grid item xs={12} sm={12} md={12} lg={12}>
                <BlueButtonComponent
                  buttonType="submit"
                  title={"Send email"}
                  loadingState={loadingState}
                  styles={{ width: "100%" }}
                  func={null}
                />
              </Grid>
            </form>
          </Grid>
        </Grid>
      </>
    );
  };

  return (
    <>
      {contextHolder}
      <ModalUX title={renderTitle()} body={body()} openDialog={customizedEmailNotificationModal} modalStyles={{ zIndex: 30 }} closeModal={closeModal} />
    </>
  );
};

export default EmailNotification;
