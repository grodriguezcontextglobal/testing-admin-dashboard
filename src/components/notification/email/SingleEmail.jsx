import { Grid, OutlinedInput } from "@mui/material";
import { Input, Modal, notification } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import BlueButtonComponent from "../../UX/buttons/BlueButton";
const { TextArea } = Input;
const SingleEmailNotification = ({
  customizedEmailNotificationModal,
  setCustomizedEmailNotificationModal,
}) => {
  const { customer } = useSelector((state) => state.customer);
  const { event } = useSelector((state) => state.event);
  const { register, handleSubmit, setValue } = useForm();
  const closeModal = () => {
    setCustomizedEmailNotificationModal(false);
  };
  const [message, setMessage] = useState("");
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg, dscpt) => {
    api.open({
      message: msg,
      description: dscpt,
    });
  };
  const onChange = (e) => {
    return setMessage(e.target.value);
  };
  const renderTitle = () => {
    return <p style={TextFontsize18LineHeight28}>Email notification</p>;
  };
  const handleSubmitEmailNotification = async (data) => {
    const emailNotificationProfile = {
      consumer: customer.email,
      subject: data.subject,
      message: message,
      eventSelected: event.eventInfoDetail.eventName,
      company: event.company,
    };
    const resp = await devitrakApi.post(
      "/nodemailer/single-email-notification",
      emailNotificationProfile
    );
    if (resp.data.ok) {
      openNotificationWithIcon("Success", "Email sent!", "Email was sent");
      setValue("subject", "");
      setValue("message", "");
      return closeModal();
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
        style={{ zIndex: 30 }}
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
            xs={12}
            sm={12}
            md={10}
            lg={10}
          >
            <p style={Subtitle}>This email will be sent to {customer.email}.</p>
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
                <BlueButtonComponent buttonType="submit" title={"Send email"} styles={{ width: "100%" }}/>
              </Grid>
            </form>
          </Grid>
        </Grid>
      </Modal>
    </>
  );
};

export default SingleEmailNotification;
