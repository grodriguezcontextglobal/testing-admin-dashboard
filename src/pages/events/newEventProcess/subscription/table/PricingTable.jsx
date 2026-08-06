import { Grid, Typography } from "@mui/material";
// import { useEffect } from "react";
import { useDispatch } from "react-redux";
import subscriptionsList from "../../../../../components/json/subscriptionList.json";
import { onAddSubscription } from "../../../../../store/slices/subscriptionSlice";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
const PricingTable = ({
  handleSubmitEventPayment,
  value,
  setTotal,
  // eventsList
}) => {
  const dispatch = useDispatch();
  // const [api, contextHolder] = notification.useNotification();
  // const openNotification = (msg, dsc) => {
  //   api.open({
  //     message: msg,
  //     description: dsc,
  //     duration: 0,
  //   });
  // };
  // useEffect(() => {
  //   const controller = new AbortController()
  //   if (eventsList?.length > 0) {
  //     openNotification("Upgrade to Access More Events", "Your access to the free tier has been disabled due to reaching the event limit. Upgrade your subscription to unlock more events and enjoy enhanced features.")
  //   }
  //   return () => {
  //     controller.abort()
  //   }
  // }, [eventsList])
  const stripeKeyCheck = String(
    import.meta.env.VITE_APP_PUBLIC_STRIPE_KEY
  ).split("_")[1];
  const dicList = {
    live: {
      month: [
        "price_1OyVdkJAluu3aB96iZmrsxZX",
        "price_1OyVeKJAluu3aB96I0rZi4VP",
      ],
      year: [
        "price_1OyVeTJAluu3aB96YpTSN6iM",
        "price_1OyVelJAluu3aB96MswKnJCg",
      ],
    },
    test: {
      month: [
        "price_1NzOBaJAluu3aB96XWZfQrBt",
        "price_1O6xsWJAluu3aB96sZsWjLGl",
      ],
      year: [
        "price_1O6xtmJAluu3aB96Rbzx7UGg",
        "price_1O6xuIJAluu3aB96AcmN6vtH",
      ],
    },
  };
  return (
    <Grid marginBottom={5} container>
      {/* {contextHolder} */}
      <Grid item xs={3}></Grid>
      <Grid
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
        gap={1}
        item
        xs={9}
      >
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          flexDirection={"column"}
          item
          xs={3}
        >
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            item
            xs={12}
          >
            <Typography
              textAlign={"left"}
              fontSize={"28px"}
              fontWeight={600}
              lineHeight={"38px"}
              fontFamily={"Inter"}
            >
              {`${"$00"}`}
            </Typography>
            &nbsp;
            <Typography
              textAlign={"left"}
              fontSize={"20px"}
              fontWeight={400}
              lineHeight={"28px"}
              fontFamily={"Inter"}
            >
              {`${value === 0 ? "per month" : "per year"}`}
            </Typography>
          </Grid>
          <Typography
            textAlign={"left"}
            fontSize={"14px"}
            fontWeight={400}
            lineHeight={"20px"}
            fontFamily={"Inter"}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit,
          </Typography>
          <BlueButtonComponent
            // disabled={eventsList?.length > 0}
            styles={{
              border: "1px solid var(--blue-dark-600, #155EEF)",
              borderRadius: "8px",
              background: "var(--blue-dark-600, #155EEF)",
              boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
              margin: "5px 0px",
            }}
            onClick={() => {
              handleSubmitEventPayment(`${value === 0 ? "00" : "00"}`);
              setTotal(`${value === 0 ? "00" : "00"}`);
              dispatch(
                onAddSubscription({
                  ...subscriptionsList.subscriptionsList[0],
                  total: `${value === 0 ? parseInt("00") : parseInt("00")}`,
                })
              );
            }}
          >
            Get started
          </BlueButtonComponent>
          <GrayButtonComponent disabled>
            Contact sales
          </GrayButtonComponent>
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          flexDirection={"column"}
          item
          xs={3}
        >
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            item
            xs={12}
          >
            <Typography
              textAlign={"left"}
              fontSize={"28px"}
              fontWeight={600}
              lineHeight={"38px"}
              fontFamily={"Inter"}
            >
              {`${value === 0 ? "$30" : "$360"}`}
            </Typography>
            &nbsp;
            <Typography
              textAlign={"left"}
              fontSize={"20px"}
              fontWeight={400}
              lineHeight={"28px"}
              fontFamily={"Inter"}
            >
              {`${value === 0 ? "per month" : "per year"}`}
            </Typography>
          </Grid>
          <Typography
            textAlign={"left"}
            fontSize={"14px"}
            fontWeight={400}
            lineHeight={"20px"}
            fontFamily={"Inter"}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit,
          </Typography>
          {/* <Tooltip title="Function still in progress."> */}
          <BlueButtonComponent
            disabled
            styles={{
              border: "1px solid var(--blue-dark-600, #155EEF)",
              borderRadius: "8px",
              background: "var(--blue-dark-600, #155EEF)",
              boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
              margin: "5px 0px",
            }}
            onClick={() => {
              handleSubmitEventPayment(
                `${
                  value === 0
                    ? dicList[stripeKeyCheck].month[0]
                    : dicList[stripeKeyCheck].year[0]
                }`
              );
              setTotal(`${value === 0 ? "30" : "360"}`);
              dispatch(
                onAddSubscription({
                  ...subscriptionsList.subscriptionsList[1],
                  total: `${value === 0 ? parseInt("30") : parseInt("360")}`,
                })
              );
            }}
          >
            Get started
          </BlueButtonComponent>
          <GrayButtonComponent disabled>
            Contact sales
          </GrayButtonComponent>
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          flexDirection={"column"}
          item
          xs={3}
        >
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            item
            xs={12}
          >
            <Typography
              textAlign={"left"}
              fontSize={"28px"}
              fontWeight={600}
              lineHeight={"38px"}
              fontFamily={"Inter"}
            >
              {`${value === 0 ? "$60" : "$720"}`}
            </Typography>
            &nbsp;
            <Typography
              textAlign={"left"}
              fontSize={"20px"}
              fontWeight={400}
              lineHeight={"28px"}
              fontFamily={"Inter"}
            >
              {`${value === 0 ? "per month" : "per year"}`}
            </Typography>
          </Grid>
          <Typography
            textAlign={"left"}
            fontSize={"14px"}
            fontWeight={400}
            lineHeight={"20px"}
            fontFamily={"Inter"}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit,
          </Typography>
          {/* <Tooltip title="Function still in progress."> */}
          <BlueButtonComponent
            disabled
            styles={{
              // width: "fit-content",
              border: "1px solid var(--blue-dark-600, #155EEF)",
              borderRadius: "8px",
              background: "var(--blue-dark-600, #155EEF)",
              boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
              margin: "5px 0px",
            }}
            onClick={() => {
              handleSubmitEventPayment(
                `${
                  value === 0
                    ? dicList[stripeKeyCheck].month[1]
                    : dicList[stripeKeyCheck].year[1]
                }`
              ); //*price_1O6xuIJAluu3aB96AcmN6vtH annually
              setTotal(`${value === 0 ? "60" : "720"}`);
              dispatch(
                onAddSubscription({
                  ...subscriptionsList.subscriptionsList[2],
                  total: `${value === 0 ? parseInt("60") : parseInt("720")}`,
                })
              );
            }}
          >
            Get started
          </BlueButtonComponent>
          <GrayButtonComponent disabled={true}>
            Contact sales
          </GrayButtonComponent>
          {/* </Tooltip> */}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default PricingTable;
