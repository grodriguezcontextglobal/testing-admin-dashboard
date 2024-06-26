import { Icon } from "@iconify/react";
import {
  // Button,
  Grid,
  Typography
} from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Divider } from "antd";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";
// import { WhitePlusIcon } from "../../../../components/icons/Icons";
import { onAddCustomerInfo } from "../../../../store/slices/customerSlice";
import {
  onAddCustomer,
  onAddDevicesAssignedInPaymentIntent,
  onAddNewPaymentIntent,
  onAddPaymentIntentDetailSelected,
  onAddPaymentIntentSelected,
} from "../../../../store/slices/stripeSlice";
// import { BlueButton } from "../../../../styles/global/BlueButton";
// import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import ConsumerActivity from "./ConsumerDetail/ConsumerActivity";
import Details from "./ConsumerDetail/Details";

const CustomerDetail = () => {
  const { setValue } = useForm();
  const { choice, event } = useSelector((state) => state.event);
  const { customer } = useSelector((state) => state.customer);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // const stripeTransactionsSavedQuery = useQuery({
  //   queryKey: ["stripeTransactionsList"],
  //   queryFn: () => devitrakApi.post("/admin/users", {
  //     "eventSelected": event.eventInfoDetail.eventName,
  //     "provider": event.company,
  //     "user":customer.uid
  //   }),
  //   enabled:false,
  //   refetchOnMount: false,
  //   notifyOnChangeProps: ['data', 'dataUpdatedAt']
  // });

  // const striperansactionsSavedQuery = useQuery({
  //   queryKey: ["striperansactionsList"],
  //   queryFn: () => devitrakApi.post("/admin/users", {
  //     "eventSelected": event.eventInfoDetail.eventName,
  //     "provider": event.company,
  //     "user":customer.uid
  //   }),
  //   enabled:false,
  //   refetchOnMount: false,
  //   notifyOnChangeProps: ['data', 'dataUpdatedAt']
  // });
  // useEffect(() => {
  //   const controller = new AbortController()
  //   stripeTransactionsSavedQuery.refetch();
  //   return () => {
  //     controller.abort()
  //   }
  // }, [customer.uid])
  
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  // const isLargeDevice = useMediaQuery(
  //   "only screen and (min-width : 993px) and (max-width : 1200px)"
  // );
  // const isExtraLargeDevice = useMediaQuery(
  //   "only screen and (min-width : 1201px)"
  // );
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
  // if (stripeTransactionsSavedQuery.isLoading) return <div style={CenteringGrid}><Loading /></div>;
  // if (stripeTransactionsSavedQuery.data) {
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
      <>
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
            {/* {(isSmallDevice || isMediumDevice) && (
              <Grid
                textAlign={"right"}
                display={"flex"}
                justifyContent={"flex-end"}
                alignItems={"center"}
                marginY={2}
                style={{
                  textWrap: "balance",
                }}
                gap={1}
                item
                xs={12}
                sm={12}
              >
                <Link style={{ width: "100%" }} to="/event/new_subscription">
                  <Button
                    style={BlueButton}
                  >
                    <WhitePlusIcon />
                    <Typography
                      textTransform={"none"}
                      style={BlueButtonText}
                    >
                      Add new event
                    </Typography>
                  </Button>
                </Link>
              </Grid>
            )} */}
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
            {/* {(isLargeDevice || isExtraLargeDevice) && (
              <Grid
                textAlign={"right"}
                display={"flex"}
                justifyContent={"flex-end"}
                alignItems={"center"}
                style={{
                  textWrap: "balance",
                }}
                gap={1}
                item
                xs={4}
              >
                <Link to="/event/new_subscription">
                  <Button
                    style={{
                      width: "fit-content",
                      border: "1px solid var(--blue-dark-600, #155EEF)",
                      borderRadius: "8px",
                      background: "var(--blue-dark-600, #155EEF)",
                      boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                    }}
                  >
                    <Icon
                      icon="ic:baseline-plus"
                      color="var(--base-white, #FFF"
                      width={20}
                      height={20}
                    />
                    &nbsp;
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
                      Add new event
                    </Typography>
                  </Button>
                </Link>
              </Grid>
            )} */}
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
        {/* <ModalToAssignDeviceFromSearch /> */}
      </>
    );
  // }
};


export default CustomerDetail;