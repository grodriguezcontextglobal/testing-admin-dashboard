import {
  FormControl,
  Grid,
  InputAdornment
} from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Divider } from "antd";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import CustomerLostItemFee from "../../../../components/stripe/elements/CustomerLostItemFee";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import Input from "../../../../components/UX/inputs/Input";
import { onAddPaymentIntentSelected } from "../../../../store/slices/stripeSlice";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import CustomerHeader from "../UI/header";
const ConsumerDeviceLostFeeCreditCard = () => {
  const [clientSecret, setClientSecret] = useState("");
  const [blocking, setBlocking] = useState(false);
  const navigator = useNavigate();
  const dispatch = useDispatch();
  const refRender = useRef(0);
  const refTotal = useRef(0);
  // const { event } = useSelector((state) => state.event);
  const { receiverToReplaceObject } = useSelector((state) => state.helper);
  const { user } = useSelector((state) => state.admin);
  const { paymentIntentReceiversAssigned } = useSelector(
    (state) => state.stripe
  );
  const { customer } = useSelector((state) => state.customer);
  let transactionStatus = new URLSearchParams(window.location.search).get(
    "redirect_status"
  );
  let transactionPaymentIntent = new URLSearchParams(
    window.location.search
  ).get("payment_intent");
  const returnDeviceValue = () => {
    if (!event?.deviceSetup) return { value: 0 };
    const { deviceSetup } = event;
    const result = deviceSetup.find(
      (element) => element.group === receiverToReplaceObject.deviceType
    );
    return result ?? { value: 0 };
  };

  const { handleSubmit, register, watch } = useForm({
    defaultValues: {
      total: `${returnDeviceValue().value}`,
    },
  });

  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );

  const verifyPaymentIntentReceiversAssignedFormat = () => {
    if (Array.isArray(paymentIntentReceiversAssigned)) {
      return paymentIntentReceiversAssigned;
    } else {
      return [paymentIntentReceiversAssigned];
    }
  };

  const triggerStripePaymentIntent = async (data) => {
    localStorage.setItem("total", data.total);
    refTotal.current = data.total; //watch("total");
    const response = await devitrakApi.post(
      "/stripe/create-payment-intent-subscription",
      {
        customerEmail: customer?.email,
        total: parseInt(watch("total")) * 100,
      }
    );

    if (response) {
      setClientSecret(response.data.paymentSubscription.client_secret);
      return setBlocking(true);
    }
  };

  const handleSubmitForm = async () => {
    if (!event) return;
    let cashReportProfile = {
      attendee: customer?.email,
      admin: user.email,
      deviceLost: [
        {
          label: receiverToReplaceObject.serialNumber,
          deviceType: receiverToReplaceObject.deviceType,
        },
      ],
      amount: localStorage.getItem("total"),
      event: event.id,
      company: user.companyData.id,
      typeCollection: "Credit Card",
      paymentIntent_charge_transaction: transactionPaymentIntent,
    };
    const respo = await devitrakApi.post(
      "/cash-report/create-cash-report",
      cashReportProfile
    );
    if (respo) {
      const stringDate = new Date().toString();
      const dateSplitting = stringDate.split(" ");
      await devitrakApi.post("/nodemailer/lost-device-fee-notification", {
        consumer: {
          name: `${customer.name} ${customer.lastName}`,
          email: customer.email,
        },
        device: {
          type: `${receiverToReplaceObject.deviceType}, serialNumber: ${receiverToReplaceObject.serialNumber}`,
        },
        amount: localStorage.getItem("total"), //refTotal.current,
        event: event.eventInfoDetail.eventName,
        company: event.company,
        date: dateSplitting.slice(0, 4).toLocaleString().replaceAll(",", " "),
        time: dateSplitting[4],
        transaction:
          verifyPaymentIntentReceiversAssignedFormat()[0].paymentIntent,
        link: `https://app.devitrak.net/authentication/${event.id}/${user.companyData.id}/${customer.uid}`,
      });
      navigator(`/consumers/${customer.uid}`);
    }
  };

  const dispatchFnAfterPaymentIntentSuccessfully = () => {
    if (transactionStatus === "succeeded") {
      return handleSubmitForm();
    }
    return null;
  };
  if (
    transactionStatus === "succeeded" &&
    transactionPaymentIntent !== "" &&
    refRender.current === 0
  ) {
    dispatchFnAfterPaymentIntentSuccessfully();
    transactionStatus = "";
    transactionPaymentIntent = "";
    // localStorage.setItem("total", "");
    refRender.current = 1;
    return navigator(`/consumers/${customer.uid}`);
  }

  const handleBackAction = () => {
    dispatch(onAddPaymentIntentSelected(""));
    navigator(`/consumers/${customer.uid}`);
  };
  return (
    <Grid
      style={{
        padding: "5px",
        display: "flex",
        justifyContent: "center",
        alignSelf: "stretch",
      }}
      container
    >
      <CustomerHeader />
      <Grid
        marginY={3}
        display={"flex"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        gap={1}
        container
      >
        <Grid item xs={12} sm={12} md={12} lg={12}>
          <form
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
            onSubmit={handleSubmit(triggerStripePaymentIntent)}
          >
            <Grid
              display={"flex"}
              alignItems={"center"}
              justifyContent={"space-between"}
              marginY={3}
              container
            >
              <Grid
                display={"flex"}
                alignItems={"center"}
                justifyContent={"flex-start"}
                item
                xs={12}
                sm={12}
                md={3}
                lg={3}
              >
                <p
                  style={{
                    ...TextFontSize30LineHeight38,
                    textTransform: "none",
                  }}
                >
                  Credit card method
                </p>
              </Grid>
              <Grid
                display={"flex"}
                alignItems={"center"}
                justifyContent={"center"}
                item
                xs={12}
                sm={12}
                md={4}
                lg={3}
              >
                <Input
                  disabled
                  value={receiverToReplaceObject.serialNumber}
                  style={{ margin: "0 5px 0 0" }}
                  fullWidth
                />
              </Grid>
              <Grid
                display={"flex"}
                alignItems={"center"}
                justifyContent={"center"}
                margin={`${(isSmallDevice || isMediumDevice) && "0 0 2dvh 0"}`}
                item
                xs={12}
                sm={12}
                md={2}
                lg={2}
              >
                <FormControl fullWidth>
                  <Input
                    disabled={blocking}
                    type="text"
                    required
                    id="outlined-adornment-amount"
                    style={OutlinedInputStyle}
                    startAdornment={
                      <InputAdornment position="start">$</InputAdornment>
                    }
                    {...register("total")}
                    name="total"
                    placeholder="Total e.g. 55 | 650"
                  />
                </FormControl>
              </Grid>
              <Grid
                display={"flex"}
                alignItems={"center"}
                justifyContent={"flex-end"}
                gap={1}
                item
                xs={12}
                sm={12}
                md={3}
                lg={4}
              >
                <GrayButtonComponent func={() => handleBackAction()} title="Cancel" />
                <BlueButtonComponent disabled={blocking} buttonType="submit" title="Add CC info" />
              </Grid>
            </Grid>
          </form>
          <Divider />
          <Grid item xs={12}>
            {clientSecret !== "" && (
              <CustomerLostItemFee
                clientSecret={clientSecret}
                total={watch("total")}
                customerStripeId={customer.uid}
                customer={customer}
                redirectUrl={`/consumers/${customer.uid}/payment-confirmation`}
              />
            )}
          </Grid>{" "}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ConsumerDeviceLostFeeCreditCard;
