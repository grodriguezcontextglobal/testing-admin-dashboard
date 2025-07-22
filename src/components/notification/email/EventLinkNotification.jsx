import { Chip, Grid, OutlinedInput, Typography } from "@mui/material";
import { Button, Modal, notification, Space } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { TextFontSize14LineHeight20 } from "../../../styles/global/TextFontSize14LineHeight20";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import { devitrakApi } from "../../../api/devitrakApi";
import BlueButtonComponent from "../../UX/buttons/BlueButton";

const EventLinkNotification = ({ sendEventLink, setSendEventLink }) => {
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const [emailConsumersList, setEmailConsumersList] = useState([]);
  const { register, handleSubmit, setValue } = useForm();
  const closeModal = () => {
    return setSendEventLink(false);
  };

  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg, dscpt) => {
    api.open({
      message: msg,
      description: dscpt,
    });
  };
  const renderTitle = () => {
    return (
      <Typography style={TextFontsize18LineHeight28}>
        Email notification
      </Typography>
    );
  };

  const handleDelete = (email) => {
    const result = emailConsumersList.filter((element) => element !== email);
    return setEmailConsumersList(result);
  };

  const handleSubmitEmailNotification = async (data) => {
    const result = [...emailConsumersList, data.email];
    setEmailConsumersList(result);
    setValue("email", "");
  };

  const handleEmailNotificationSent = async () => {
    const emailNotificationProfile = {
      list: emailConsumersList,
      company: user.companyData.company_name,
      buttonLink: event.qrCodeLink,
      contactInfo: {
        staff: `${user.name} ${user.lastName}`,
        email: user.email,
      },
      eventName: event.eventInfoDetail.eventName,
    };
    const resp = await devitrakApi.post(
      "/nodemailer/send-consumer-app-instructions",
      emailNotificationProfile
    );
    if (resp) {
      openNotificationWithIcon("Success", "Email sent!", "Link of this event!");
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
        open={sendEventLink}
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
            <Typography
              textTransform={"none"}
              textAlign={"center"}
              color={"var(--gray-600, #475467)"}
              style={TextFontSize14LineHeight20}
            >
              The link of this event will be sent to consumers emails submitted.
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
              id="add-email-contact"
              style={{ width: "90%", gap: "5px" }}
              onSubmit={handleSubmit(handleSubmitEmailNotification)}
            >
              <Grid marginY={"0.5rem"} item xs={12}>
                <OutlinedInput
                  required
                  placeholder=""
                  fullWidth
                  style={{
                    ...OutlinedInputStyle,
                    width: "100%",
                    margin: "0 5px 0 0",
                  }}
                  {...register("email")}
                />
              </Grid>
            </form>
            <aside style={{ marginLeft: "5px" }}>
              <Button
                form="add-email-contact"
                htmlType="submit"
                style={{
                  ...BlueButton,
                  width: "100%",
                }}
              >
                <Typography
                  textTransform={"none"}
                  style={{
                    ...BlueButtonText,
                    ...CenteringGrid,
                    width: "fit-content",
                  }}
                >
                  Add email
                </Typography>
              </Button>
            </aside>
          </Grid>
          <Grid
            display={"flex"}
            alignItems={"center"}
            justifyContent={"center"}
            margin={"auto"}
            item
            xs={10}
          >
            <Space size={[8, 16]} wrap style={{ margin: "15px auto" }}>
              {emailConsumersList.map((email) => (
                <Chip
                  key={email}
                  label={email}
                  onDelete={() => handleDelete(email)}
                />
              ))}
            </Space>
          </Grid>
          <Grid
            display={emailConsumersList.length === 0 ? "none" : "flex"}
            alignItems={"center"}
            justifyContent={"center"}
            margin={"auto"}
            item
            xs={10}
          >
            <BlueButtonComponent
              styles={{ width: "100%" }}
              func={handleEmailNotificationSent}
              title={"Send link"}
            />
          </Grid>
        </Grid>
      </Modal>
    </>
  );
};

export default EventLinkNotification;
