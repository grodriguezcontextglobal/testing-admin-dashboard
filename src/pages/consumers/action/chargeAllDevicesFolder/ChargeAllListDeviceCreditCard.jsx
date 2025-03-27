/* eslint-disable react-hooks/exhaustive-deps */
import {
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { message } from "antd";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import CustomerLostItemFee from "../../../../components/stripe/elements/CustomerLostItemFee";
import { onAddPaymentIntentSelected } from "../../../../store/slices/stripeSlice";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import CustomerHeader from "../../components/UI/header";

const ChargeAllListDeviceCreditCard = () => {
  const [clientSecret, setClientSecret] = useState("");
  const { register, handleSubmit, watch } = useForm();
  const { receiverToReplaceObject } = useSelector((state) => state.helper);
  const { customer } = useSelector((state) => state.customer);
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const refTotal = useRef(0);
  let transactionStatus = new URLSearchParams(window.location.search).get(
    "redirect_status"
  );
  let transactionPaymentIntent = new URLSearchParams(
    window.location.search
  ).get("payment_intent");

  const { paymentIntentReceiversAssigned } = useSelector(
    (state) => state.stripe
  );
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  const navigator = useNavigate();
  const dispatch = useDispatch();
  const [messageApi, contextHolder] = message.useMessage();
  const loading = () => {
    messageApi.open({
      type: "loading",
      content: "Action in progress..",
      duration: 0,
    });
  };
  const queryClient = useQueryClient();

  const triggerStripePaymentIntent = async (data) => {
    localStorage.setItem("total", data.total);
    refTotal.current = data.total;
    const response = await devitrakApi.post(
      "/stripe/create-payment-intent-subscription",
      {
        customerEmail: customer?.email,
        total: parseInt(watch("total")) * 100,
      }
    );

    if (response) {
      return setClientSecret(response.data.paymentSubscription.client_secret);
    }
  };

  const handleLostDeviceCreditCardLostFee = async () => {
    let cashReportProfile = {
      attendee: customer?.email,
      admin: user.email,
      deviceLost: [
        ...receiverToReplaceObject.map((item) => {
          return {
            label: item.serialNumber,
            deviceType: item.deviceType,
          };
        }),
      ],
      amount: localStorage.getItem("total"),
      event: event.id,
      company: user.companyData.id,
      paymentIntent_charge_transaction: transactionPaymentIntent,
      typeCollection: "Credit Card",
    };
    loading();
    const respo = await devitrakApi.post(
      "/cash-report/create-cash-report",
      cashReportProfile
    );
    if (respo.data) {
      const stringDate = new Date().toString();
      const dateSplitting = stringDate.split(" ");
      for (let item of receiverToReplaceObject) {
        const template = {
          consumer: {
            name: `${customer.name} ${customer.lastName}`,
            email: customer.email,
          },
          amount: localStorage.getItem("total"),
          event: event.eventInfoDetail.eventName,
          company: event.company,
          date: dateSplitting.slice(0, 4),
          time: dateSplitting[4],
          device: {
            serialNumber: item.serialNumber,
            deviceType: item.deviceType,
          },
          transaction: paymentIntentReceiversAssigned[0].paymentIntent,
          link: `https://app.devitrak.net/authentication/${event.id}/${user.companyData.id}/${customer.uid}`,
        };
        await devitrakApi.post(
          "/nodemailer/lost-device-fee-notification",
          template
        );
      }
      queryClient.invalidateQueries({
        queryKey: [
          "assignedDevicesByTransaction",
          paymentIntentReceiversAssigned[0].paymentIntent,
        ],
        exact: true,
      });
      messageApi.destroy();
      return navigator(`/consumers/${customer.uid}`);
    }
  };

  const handleBackAction = () => {
    dispatch(onAddPaymentIntentSelected(""));
    navigator(`/consumers/${customer.uid}`);
  };

  useEffect(() => {
    const controller = new AbortController();
    if (transactionStatus === "succeeded" && transactionPaymentIntent !== "") {
      handleLostDeviceCreditCardLostFee();
    }

    return () => {
      controller.abort();
    };
  }, [transactionStatus, transactionPaymentIntent]);

  return (
    <>
      {contextHolder}
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
                alignSelf: "flex-start",
                gap: "10px",
              }}
              onSubmit={handleSubmit(triggerStripePaymentIntent)}
            >
              <Grid
                display={"flex"}
                alignItems={"center"}
                justifyContent={"space-between"}
                container
              >
                <Grid
                  display={"flex"}
                  alignItems={"center"}
                  justifyContent={"flex-start"}
                  alignSelf={"flex-start"}
                  item
                  xs={12}
                  sm={12}
                  md={12}
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
                  alignSelf={"flex-start"}
                  item
                  xs={12}
                  sm={12}
                  md={4}
                  lg={3}
                >
                  <ul
                    style={{
                      ...OutlinedInputStyle,
                      height: "fit-content",
                      border: "1px solid var(--gray-200, #eaecf0)",
                    }}
                  >
                    {receiverToReplaceObject.map((item) => (
                      <li
                        key={item.serialNumber}
                        style={{ margin: "0 0 10px 0" }}
                      >
                        {item.serialNumber} - {item.deviceType}
                      </li>
                    ))}
                  </ul>
                </Grid>
                <Grid
                  display={"flex"}
                  alignItems={"center"}
                  justifyContent={"center"}
                  margin={`${
                    (isSmallDevice || isMediumDevice) && "0 0 2dvh 0"
                  }`}
                  alignSelf={"flex-start"}
                  item
                  xs={12}
                  sm={12}
                  md={4}
                  lg={3}
                >
                  <FormControl fullWidth>
                    <InputLabel htmlFor="outlined-adornment-amount">
                      <p
                        style={{
                          color: "#000",
                          fontSize: "14px",
                          fontWeight: "600",
                          fontFamily: "Inter",
                          lineHeight: "20px",
                          textTransform: "none",
                        }}
                      >
                        Amount
                      </p>
                    </InputLabel>
                    <OutlinedInput
                      label="Amount"
                      type="text"
                      required
                      id="outlined-adornment-amount"
                      style={OutlinedInputStyle}
                      startAdornment={
                        <InputAdornment position="start">$</InputAdornment>
                      }
                      {...register("total")}
                      name="total"
                    />
                  </FormControl>
                </Grid>
                <Grid
                  display={"flex"}
                  alignItems={"center"}
                  justifyContent={"flex-end"}
                  alignSelf={"flex-start"}
                  gap={1}
                  item
                  xs={12}
                  sm={12}
                  md={3}
                  lg={2}
                >
                  <button
                    type="reset"
                    style={{
                      ...GrayButton,
                      width: "fit-content",
                    }}
                    onClick={() => handleBackAction()}
                  >
                    <p style={{ ...GrayButtonText, textTransform: "none" }}>
                      Cancel
                    </p>
                  </button>{" "}
                  <button
                    style={{
                      ...BlueButton,
                      width: "fit-content",
                    }}
                    type="submit"
                  >
                    <p style={{ ...BlueButtonText, textTransform: "none" }}>
                      CC Info
                    </p>
                  </button>
                </Grid>
              </Grid>
            </form>
          </Grid>
        </Grid>
        <Grid
          marginY={3}
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          gap={1}
          container
        >
          <Grid item xs={12} sm={12} md={12} lg={12}>
            {clientSecret !== "" && (
              <CustomerLostItemFee
                clientSecret={clientSecret}
                total={refTotal.current}
                customerStripeId={customer.uid}
                customer={customer}
                redirectUrl="charge-all-lost-devices/credit_card"
              />
            )}
          </Grid>{" "}
        </Grid>
      </Grid>
    </>
  );
};

export default ChargeAllListDeviceCreditCard;
