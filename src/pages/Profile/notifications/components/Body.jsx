import {
  Grid,
  Typography
} from "@mui/material";
import { message, notification } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import { onLogin } from "../../../../store/slices/adminSlice";
import "./Body.css";
import BodyForm from "./BodyForm";
const Body = () => {
  const { user } = useSelector((state) => state.admin);
  const emailNotifications = user?.data?.emailNotifications;
  const { register, handleSubmit } = useForm({
    defaultValues: {
      newsAndUpdates: emailNotifications?.newsAndUpdates ?? false,
      tipsAndTutorials: emailNotifications?.tipsAndTutorials ?? false,
      userResearch: emailNotifications?.userResearch ?? false,
    },
  });
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState(
    user?.data?.subscriptionRenewals ?? ""
  );
  const [eventsReminders, setEventsReminders] = useState(
    user?.data?.eventReminder ?? ""
  );
  const [dailySummaries, setDailySummaries] = useState(
    user?.data?.dailySummaries ?? ""
  );
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = () => {
    api.open({
      message: "Information updated",
    });
  };

  const renderLabel = ({ bodyContent }) => {
    return (
      <Grid
        display={"flex"}
        flexDirection={"column"}
        alignItems={"center"}
        item
        xs={12}
        sm={12}
        md={12}
      >
        <Typography
          textTransform={"none"}
          style={{
            color: "var(--gray-700, #484d47)",
            textAlign: "left",
            fontSize: "14px",
            fontWeight: "500",
            fontFamily: "Inter",
            lineHeight: "20px",
            width: "100%",
          }}
        >
          {bodyContent.title}
        </Typography>
        <Typography
          textTransform={"none"}
          style={{
            color: "var(--gray-600, #5d615a)",
            textAlign: "left",
            fontSize: "14px",
            fontWeight: "400",
            fontFamily: "Inter",
            lineHeight: "20px",
          }}
        >
          {bodyContent.description}
        </Typography>
      </Grid>
    );
  };
  const handleUpdatePersonalInfo = async (data) => {
    try {
      const resp = await devitrakApi.patch(`/admin/admin-user/${user.uid}`, {
        emailNotifications: {
          newsAndUpdates: data.newsAndUpdates,
          tipsAndTutorials: data.tipsAndTutorials,
          userResearch: data.userResearch,
        },
        dailySummaries: dailySummaries,
        subscriptionRenewals: subscriptions,
        eventReminder: eventsReminders,
      });
      if (resp?.data?.adminUpdated) {
        openNotificationWithIcon("Success");
        dispatch(
          onLogin({
            ...user,
            data: {
              ...user.data,
              emailNotifications: resp.data.adminUpdated.emailNotifications,
              dailySummaries: resp.data.adminUpdated.dailySummaries,
              subscriptionRenewals: resp.data.adminUpdated.subscriptionRenewals,
              eventReminder: resp.data.adminUpdated.eventReminder,
            },
          })
        );
      } else {
        message.error("Failed to update notification settings.");
      }
    } catch (error) {
      message.error(
        error?.response?.data?.msg ||
          "Failed to update notification settings. Please try again."
      );
    }
  };
  return (
    <>
      {contextHolder}
      <BodyForm
        handleUpdatePersonalInfo={handleUpdatePersonalInfo}
        handleSubmit={handleSubmit}
        register={register}
        emailNotifications={emailNotifications}
        renderLabel={renderLabel}
        setDailySummaries={setDailySummaries}
        setEventsReminders={setEventsReminders}
        setSubscriptions={setSubscriptions}
        navigate={navigate}
        subscriptions={subscriptions}
        dailySummaries={dailySummaries}
        eventsReminders={eventsReminders}
      />
    </>
  );
};

export default Body;
