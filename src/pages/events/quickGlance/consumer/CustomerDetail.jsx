import { Icon } from "@iconify/react";
import {
  Grid,
  Typography
} from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Divider } from "antd";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";
import { onAddCustomerInfo } from "../../../../store/slices/customerSlice";
import {
  onAddCustomer,
  onAddDevicesAssignedInPaymentIntent,
  onAddNewPaymentIntent,
  onAddPaymentIntentDetailSelected,
  onAddPaymentIntentSelected,
} from "../../../../store/slices/stripeSlice";
import ConsumerActivity from "./ConsumerDetail/ConsumerActivity";
import Details from "./ConsumerDetail/Details";

const CustomerDetail = () => {
  const { setValue } = useForm();
  const { choice, event } = useSelector((state) => state.event);
  const { customer } = useSelector((state) => state.customer);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  useEffect(() => {
    const controller = new AbortController()
    const refreshing = async () => {
      await setValue('searchEvent', '  ')
      setTimeout(() => {
        setValue('searchEvent', '')
      }, 200)
    }
    refreshing()
    return () => {
      controller.abort()
    }
  }, [])

  const handleBackAction = () => {
      dispatch(onAddNewPaymentIntent([]));
      dispatch(onAddCustomerInfo(undefined));
      dispatch(onAddCustomer(null));
      dispatch(onAddNewPaymentIntent([]));
      dispatch(onAddPaymentIntentDetailSelected([]));
      dispatch(onAddPaymentIntentSelected(undefined));
      dispatch(onAddDevicesAssignedInPaymentIntent(undefined));
      navigate("/events/event-quickglance");
    };
    const handleBackActionToMain = () => {
      dispatch(onAddNewPaymentIntent([]));
      dispatch(onAddCustomerInfo(undefined));
      dispatch(onAddCustomer(null));
      dispatch(onAddNewPaymentIntent([]));
      dispatch(onAddPaymentIntentDetailSelected([]));
      dispatch(onAddPaymentIntentSelected(undefined));
      dispatch(onAddDevicesAssignedInPaymentIntent(undefined));
      navigate("/events");
    };
    return (
        <Grid
          style={{
            padding: "5px",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
          container
        >
          <Grid
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            container
          >
            <Grid marginY={0} item xs={12} sm={12} md={8}>
              <Typography
                textTransform={"none"}
                style={{
                  color: "var(--gray-900, #101828)",
                  lineHeight: "38px",
                }}
                textAlign={"left"}
                fontWeight={600}
                fontFamily={"Inter"}
                fontSize={"30px"}
              >
                Consumer activity in {event?.eventInfoDetail?.eventName}
              </Typography>
            </Grid>
          </Grid>
          <Grid
            style={{
              paddingTop: "0px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            container
            marginTop={4}
          >
            <Grid marginY={0} item xs={12} sm={12} md={8}>
              <Grid
                display={"flex"}
                justifyContent={"flex-start"}
                alignItems={"center"}
                item
                xs={12}
              >
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  fontWeight={600}
                  fontSize={"18px"}
                  fontFamily={"Inter"}
                  lineHeight={"28px"}
                  color={"var(--blue-dark-600, #155EEF)"}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleBackActionToMain()}
                >
                  All events
                </Typography>
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  fontWeight={600}
                  fontSize={"18px"}
                  fontFamily={"Inter"}
                  lineHeight={"28px"}
                  color={"var(--blue-dark-600, #155EEF)"}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleBackAction()}
                >
                  <Icon icon="mingcute:right-line" color="#000" />
                  {choice}
                </Typography>
                <Typography
                  textTransform={"capitalize"}
                  textAlign={"left"}
                  fontWeight={600}
                  fontSize={"18px"}
                  fontFamily={"Inter"}
                  lineHeight={"28px"}
                  color={"var(--gray-900, #101828)"}
                >
                  <Icon icon="mingcute:right-line" color="#000" />
                  {customer?.name} {customer?.lastName}
                </Typography>{" "}
              </Grid>
              <Grid
                paddingTop={1}
                display={"flex"}
                justifyContent={"flex-start"}
                alignItems={"center"}
                item
                xs={12}
              >
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  fontWeight={400}
                  fontSize={"14px"}
                  fontFamily={"Inter"}
                  lineHeight={"20px"}
                  color={"var(--gray-600, #475467)"}
                >
                  {event?.eventInfoDetail?.address}
                </Typography>
              </Grid>
            </Grid>
            <Grid textAlign={"right"} item xs={4}></Grid>
          </Grid>
          <Divider />
          <Grid container>
            <Grid marginY={`${(isSmallDevice || isMediumDevice) && '3dvh'}`} item xs={12}>
              <Details />
            </Grid>
            <Grid item xs={12}>
              <ConsumerActivity />
            </Grid>
          </Grid>
          <Divider />
          <Outlet />
        </Grid >
    );
  // }
};


export default CustomerDetail;