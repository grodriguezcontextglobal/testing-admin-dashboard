import { Grid, OutlinedInput } from "@mui/material";
import { Input, notification } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../styles/global/Subtitle";
// import { data } from "../../../mock/mockData";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

const Remainders = () => {
  const { user } = useSelector((state) => state.admin);
  const location = useLocation();
  const slug = location.pathname.split("/").filter(Boolean).at(-2);
  const [membersData, setMembersData] = useState(null);
  const memberInfoRetrieveQuery = useQuery({
    queryKey: ["memberInfoRetrieveQuery"],
    queryFn: () =>
      devitrakApi.post("/db_member/consulting-member", {
        member_id: Number(slug),
      }),
    enabled: !!slug,
  });

  useEffect(() => {
    if (memberInfoRetrieveQuery?.data?.data?.members) {
      setMembersData(memberInfoRetrieveQuery?.data?.data?.members);
    }
  }, [memberInfoRetrieveQuery.data]);
  const { TextArea } = Input;
  const { register, handleSubmit, setValue } = useForm();
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
  const handleSubmitEmailNotification = async (data) => {
    const emailNotificationProfile = {
      consumer: membersData?.email,
      subject: data.subject,
      message: message,
      eventSelected: event.eventInfoDetail.eventName,
      company: user,
    };
    const resp = await devitrakApi.post(
      "/nodemailer/single-email-notification",
      emailNotificationProfile
    );
    if (resp.data.ok) {
      openNotificationWithIcon("Success", "Email sent!", "Email was sent");
      setValue("subject", "");
      setValue("message", "");
      return null;
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
        <p style={Subtitle}>This email will be sent to {membersData?.email}.</p>
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
