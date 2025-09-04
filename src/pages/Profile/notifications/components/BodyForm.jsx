import {
    Checkbox,
    FormControlLabel,
    Grid,
    InputLabel,
    Radio,
    RadioGroup,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { Divider } from "antd";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";

const BodyForm = ({
  handleUpdatePersonalInfo,
  handleSubmit,
  register,
  renderLabel,
  subscriptions,
  dailySummaries,
  eventsReminders,
  setDailySummaries,
  setEventsReminders,
  setSubscriptions,
  navigate,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <form
      onSubmit={handleSubmit(handleUpdatePersonalInfo)}
      style={{
        width: "100%",
        padding: isMobile ? "16px 8px" : "24px",
      }}
    >
      <Grid
        container
        spacing={isMobile ? 2 : 3}
        style={{
          padding: isMobile ? "8px" : "16px",
        }}
      >
        {/* Notifications from us section */}
        <Grid
          item
          xs={12}
          sm={12}
          md={6}
          display="flex"
          flexDirection="column"
          gap={1}
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
            xs={12}
            sm={12}
            md={8}
          >
            <FormControlLabel
              control={<Checkbox {...register("newsAndUpdates")} />}
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
              control={<Checkbox {...register("tipsAndTutorials")} />}
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
              control={<Checkbox {...register("userResearch")} />}
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
                  description: "Only notify me about device inventory summary",
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
        <GrayButtonComponent
          title={"Cancel"}
          func={() => navigate("/")}
          style={{
            width: isMobile ? "100%" : "fit-content",
          }}
        />
        <BlueButtonComponent
          buttonType="submit"
          title={"Save"}
          style={{
            width: isMobile ? "100%" : "fit-content",
          }}
        />
      </Grid>
    </form>
  );
};

export default BodyForm;
