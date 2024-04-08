import { Grid, OutlinedInput, Typography } from "@mui/material";
import { Button, Modal, notification } from "antd";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { BlueButton } from "../../../styles/global/BlueButton";
import { devitrakApi } from "../../../api/devitrakApi";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../styles/global/CenteringGrid";
const EmailNotification = ({
  customizedEmailNotificationModal,
  setCustomizedEmailNotificationModal,
}) => {
  const { consumersOfEvent } = useSelector((state) => state.customer);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();
  const closeModal = () => {
    setCustomizedEmailNotificationModal(false);
  };
  const renderListOfEmailsOfConsumersPerEvent = () => {
    const result = [];
    consumersOfEvent.forEach((element) => result.unshift(element.email));
    return result;
  };
  renderListOfEmailsOfConsumersPerEvent();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg, dscpt) => {
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
    const emailNotificationProfile = {
      consumersList: renderListOfEmailsOfConsumersPerEvent(),
      subject: data.subject,
      message: data.message,
    };
    const resp = await devitrakApi.post(
      "/nodemailer/customized-notification",
      emailNotificationProfile
    );
    if (resp) {
      openNotificationWithIcon(
        "success",
        "Email sent!",
        "Email was sent to all consumers of this event!"
      );
      setValue("subject", "");
      setValue("message", "");
      closeModal();
    }
  };
  return (
    <>
      {contextHolder}
      <Modal
        title={renderTitle()}
        centered
        open={customizedEmailNotificationModal}
        onOk={() => closeModal()}
        onCancel={() => closeModal()}
        footer={[]}
        width={1000}
        maskClosable={false}
      >
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
            xs={12} sm={12} md={10} lg={10}
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
            <form style={{ width: "100%" }} onSubmit={handleSubmit(handleSubmitEmailNotification)}>
              <Grid marginY={"0.5rem"} item xs={12}>
                <OutlinedInput
                  placeholder="Your email's subject here."
                  fullWidth
                  style={OutlinedInputStyle}
                  {...register("subject", { required: true, maxLength: 600 })}
                />
                {errors.subject && <Typography>{errors.subject}</Typography>}
              </Grid>
              <Grid marginY={"0.5rem"} item xs={12}>
                <OutlinedInput
                  minRows={4}
                  multiline
                  fullWidth
                  {...register("message", {
                    required: true,
                  })}
                  placeholder="Write your email here."
                  style={{
                    ...OutlinedInputStyle,
                    width: "100%",
                    padding: "5px",
                    overflow: "hidden",
                    textWrap: "balance",
                  }}
                />
                {errors.subject && <Typography>{errors.message}</Typography>}
              </Grid>
              <Grid item xs={12} sm={12} md={12} lg={12}>
                <Button
                  htmlType="submit"
                  style={{
                    ...BlueButton, width: "100%",
                  }}
                >
                  <Typography
                    textTransform={"none"}
                    style={{ ...BlueButtonText, ...CenteringGrid }}
                  >Send email</Typography>
                </Button>
              </Grid>
            </form>
          </Grid>
        </Grid>
      </Modal>
    </>
  );
};

export default EmailNotification;