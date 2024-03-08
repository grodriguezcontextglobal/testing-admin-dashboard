import {
  Grid,
  Button,
  Typography,
  InputLabel,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
} from "@mui/material";
import { Divider, notification } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import "./Body.css";
import { devitrakApi } from "../../../../api/devitrakApi";
import { onLogin } from "../../../../store/slices/adminSlice";
const Body = () => {
  const { user } = useSelector((state) => state.admin);
  const { register, handleSubmit } = useForm();

  const [subscriptions, setSubscriptions] = useState(
    user.data.subscriptionRenewals
  );
  const [eventsReminders, setEventsReminders] = useState(
    user.data.eventReminder
  );
  const [dailySummaries, setDailySummaries] = useState(
    user.data.dailySummaries
  );
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type) => {
    api[type]({
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
            color: "#344054",
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
            color: "var(--gray-600, #475467)",
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
    if (resp.data) {
      openNotificationWithIcon("success");
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
    }
  };
  return (
    <>
      {contextHolder}
      <form
        onSubmit={handleSubmit(handleUpdatePersonalInfo)}
        style={{
          width: "100%",
        }}
      >
        <Grid
          style={{
            padding: "5px",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
          container
        >
          {" "}
          <Grid
            display={"flex"}
            flexDirection={"column"}
            alignSelf={"stretch"}
            marginY={0}
            item
            xs={6}
            sm={6}
            md={6}
          >
            <InputLabel style={{ width: "100%" }}>
              <Typography
                textTransform={"none"}
                style={{
                  color: "#344054",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "500",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                }}
              >
                Notifications from us
              </Typography>
            </InputLabel>
            <InputLabel style={{ width: "100%" }}>
              <Typography
                textTransform={"none"}
                style={{
                  color: "var(--gray-600, #475467)",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "400",

                  fontFamily: "Inter",
                  lineHeight: "20px",
                  textWrap: "balance",
                }}
              >
                Receive the latest news, updates and industry tutorials from
                Devitrak.
              </Typography>
            </InputLabel>
          </Grid>
          <Grid
            display={"flex"}
            flexDirection={"column"}
            alignSelf={"stretch"}
            marginY={0}
            item
            xs={6}
            sm={6}
            md={6}
          >
            <Grid
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              marginY={0}
              gap={2}
              item
              xs={8}
              sm={8}
              md={8}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    {...register("newsAndUpdates")}
                  />
                }
                label={renderLabel({
                  bodyContent: {
                    title: "News and updates",
                    description: "News about product and feature updates.",
                  },
                })}
              />
            </Grid>
            <Grid
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              marginY={0}
              gap={2}
              item
              xs={12}
              sm={12}
              md={12}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    {...register("tipsAndTutorials")}
                  />
                }
                label={renderLabel({
                  bodyContent: {
                    title: "Tips and tutorials",
                    description: "Tips on getting more out of Untitled.",
                  },
                })}
              />
            </Grid>
            <Grid
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              marginY={0}
              gap={2}
              item
              xs={12}
              sm={12}
              md={12}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    {...register("userResearch")}
                  />
                }
                label={renderLabel({
                  bodyContent: {
                    title: "User research",
                    description:
                      "Get involved in our beta testing program or participate in paid product user research.",
                  },
                })}
              />
            </Grid>
          </Grid>
          <Divider />
          <Grid
            display={"flex"}
            flexDirection={"column"}
            alignSelf={"stretch"}
            marginY={0}
            item
            xs={6}
            sm={6}
            md={6}
          >
            <InputLabel style={{ width: "100%" }}>
              <Typography
                textTransform={"none"}
                style={{
                  color: "#344054",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "500",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                }}
              >
                Daily summaries
              </Typography>
            </InputLabel>
            <InputLabel style={{ width: "100%" }}>
              <Typography
                textTransform={"none"}
                style={{
                  color: "var(--gray-600, #475467)",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "400",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                  textWrap: "balance",
                }}
              >
                These are notifications for daily summaries of your devices
                inventory and staff activity.
              </Typography>
            </InputLabel>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            marginY={0}
            gap={2}
            item
            xs={6}
            sm={6}
            md={6}
          >
            <RadioGroup
              aria-labelledby="demo-controlled-radio-buttons-group"
              name="controlled-radio-buttons-group"
              value={dailySummaries}
              onChange={(e) => setDailySummaries(e.target.value)}
            >
              <FormControlLabel
                value="Do not notifiy me"
                control={<Radio />}
                label="Do not notifiy me"
              />
              <FormControlLabel
                value="Device inventory only"
                control={<Radio />}
                label={renderLabel({
                  bodyContent: {
                    title: "Device inventory only",
                    description:
                      "Only notify me about device inventory summary",
                  },
                })}
              />
              <FormControlLabel
                value="Full summary"
                control={<Radio />}
                label={renderLabel({
                  bodyContent: {
                    title: "Full summary",
                    description:
                      "Notify me about all inventory and staff activity summary.",
                  },
                })}
              />
            </RadioGroup>
          </Grid>
          <Divider />
          <Grid
            display={"flex"}
            flexDirection={"column"}
            alignSelf={"stretch"}
            marginY={0}
            item
            xs={6}
            sm={6}
            md={6}
          >
            <InputLabel style={{ width: "100%" }}>
              <Typography
                textTransform={"none"}
                style={{
                  color: "#344054",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "500",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                }}
              >
                Event reminders
              </Typography>
            </InputLabel>
            <InputLabel style={{ width: "100%" }}>
              <Typography
                textTransform={"none"}
                style={{
                  color: "var(--gray-600, #475467)",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "400",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                }}
              >
                These are notifications to remind you of event details and
                updates.
              </Typography>
            </InputLabel>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            marginY={0}
            gap={2}
            item
            xs={6}
            sm={6}
            md={6}
          >
            <RadioGroup
              aria-labelledby="demo-controlled-radio-buttons-group"
              name="controlled-radio-buttons-group"
              value={eventsReminders}
              onChange={(e) => setEventsReminders(e.target.value)}
            >
              <FormControlLabel
                value="Do not notifiy me"
                control={<Radio />}
                label="Do not notifiy me"
              />
              <FormControlLabel
                value="All reminders"
                control={<Radio />}
                label={renderLabel({
                  bodyContent: {
                    title: "All reminders",
                    description: "Notify me about all event reminders.",
                  },
                })}
              />
            </RadioGroup>
          </Grid>
          <Divider />
          <Grid
            display={"flex"}
            flexDirection={"column"}
            alignSelf={"stretch"}
            marginY={0}
            item
            xs={6}
            sm={6}
            md={6}
          >
            <InputLabel style={{ width: "100%" }}>
              <Typography
                textTransform={"none"}
                style={{
                  color: "#344054",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "500",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                }}
              >
                Subscription renewals
              </Typography>
            </InputLabel>
            <InputLabel style={{ width: "100%" }}>
              <Typography
                textTransform={"none"}
                style={{
                  color: "var(--gray-600, #475467)",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "500",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                  textWrap: "balance",
                }}
              >
                These are notifications to remind you that an upcoming invoice
                will be processed for your Devitrak account.
              </Typography>
            </InputLabel>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            marginY={0}
            gap={2}
            item
            xs={6}
            sm={6}
            md={6}
          >
            <RadioGroup
              aria-labelledby="demo-controlled-radio-buttons-group"
              name="controlled-radio-buttons-group"
              value={subscriptions}
              onChange={(e) => setSubscriptions(e.target.value)}
            >
              <FormControlLabel
                value="Do not notifiy me"
                control={<Radio />}
                label="Do not notifiy me"
              />
              <FormControlLabel
                value="All remiders"
                control={<Radio />}
                label={renderLabel({
                  bodyContent: {
                    title: "All reminders",
                    description: "Notify me for all other activity.",
                  },
                })}
              />
            </RadioGroup>
          </Grid>
          <Divider />
        </Grid>{" "}
        <Grid
          display={"flex"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          marginY={0}
          gap={2}
          item
          xs={12}
          sm={12}
          md={12}
        >
          <Button
            style={{
              width: "fit-content",
              border: "1px solid var(--gray-300, #D0D5DD)",
              borderRadius: "8px",
              background: "var(--base-white, #FFF)",
              boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
            }}
          >
            <Typography
              textTransform={"none"}
              style={{
                color: "#344054",
                fontSize: "14px",
                fontWeight: "600",
                fontFamily: "Inter",
                lineHeight: "20px",
              }}
            >
              Cancel
            </Typography>
          </Button>
          <Button
            type="submit"
            style={{
              width: "fit-content",
              border: "1px solid var(--blue-dark-600, #155EEF)",
              borderRadius: "8px",
              background: "var(--blue-dark-600, #155EEF)",
              boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05",
            }}
          >
            <Typography
              textTransform={"none"}
              style={{
                color: "var(--base-white, #FFF",
                fontSize: "14px",
                fontWeight: "600",
                fontFamily: "Inter",
                lineHeight: "20px",
              }}
            >
              Save
            </Typography>
          </Button>
        </Grid>
      </form>{" "}
    </>
  );
};

export default Body;
