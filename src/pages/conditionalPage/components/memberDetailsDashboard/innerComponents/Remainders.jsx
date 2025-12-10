import { Grid, OutlinedInput } from "@mui/material";
import { Input, notification } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { useNavigate } from "react-router-dom";
// import { data } from "../../../mock/mockData";

const Remainders = () => {
  const { user } = useSelector((state) => state.admin);
  const { memberInfo } = useSelector((state) => state.member);
  const { TextArea } = Input;
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { subject: "", message: "" },
  });
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
  const navigate = useNavigate()
  const handleSubmitEmailNotification = async (data) => {
    const emailNotificationProfile = {
      consumer: memberInfo?.email,
      subject: data.subject,
      message: message,
      eventSelected: "",
      company: user.companyData.company_name,
    };
    const resp = await devitrakApi.post(
      "/nodemailer/single-email-notification",
      emailNotificationProfile
    );
    if (resp.data.ok) {
      openNotificationWithIcon("Success", "Email sent!", "Email was sent");
      // Reset form fields and local state to original defaults
      reset();
      setMessage("");
      return navigate(`/member/${memberInfo?.member_id}/main`);
    }
  };
  return (
    <Grid
      display={"flex"}
      alignItems={"center"}
      justifyContent={"flex-start"}
      margin={"auto"}
      container
    >
      {contextHolder}
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
        <p style={Subtitle}>This email will be sent to {memberInfo?.email}.</p>
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
              styles={{ width: "100%" }}
            />
          </Grid>
        </form>
      </Grid>
    </Grid>
  );
};

export default Remainders;
