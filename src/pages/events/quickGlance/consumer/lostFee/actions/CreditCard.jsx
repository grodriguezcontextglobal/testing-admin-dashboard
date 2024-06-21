import {
  Button,
  Grid,
  InputAdornment,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Alert } from "antd";
import _ from "lodash";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import { LostDeviceStripeElement } from "../../../../../../components/stripe/elements/LostDeviceStripeElement";
import { onAddPaymentIntentSelected } from "../../../../../../store/slices/stripeSlice";
import { BlueButton } from "../../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../../../../../styles/global/OutlinedInputStyle";
import TextFontsize18LineHeight28 from "../../../../../../styles/global/TextFontSize18LineHeight28";
import { LightBlueButton } from "../../../../../../styles/global/LightBlueButton";
const CreditCard = () => {
  const [clientSecret, setClientSecret] = useState("");
  const [blocking, setBlocking] = useState(false);
  const navigator = useNavigate();
  const dispatch = useDispatch();
  const refRender = useRef(0);
  const refTotal = useRef(0);
  const { choice, company, event } = useSelector((state) => state.event);
  const { receiverToReplaceObject } = useSelector((state) => state.helper);
  const { user } = useSelector((state) => state.admin);
  const { customer, paymentIntentReceiversAssigned } = useSelector(
    (state) => state.stripe
  );

  let transactionStatus = new URLSearchParams(window.location.search).get(
    "redirect_status"
  );
  let transactionPaymentIntent = new URLSearchParams(
    window.location.search
  ).get("payment_intent");
  const returnDeviceValue = () => {
    const resultFound = new Set();
    const { deviceSetup } = event;
    for (let data of deviceSetup) {
      if (data.consumerUses) {
        resultFound.add(data);
      }
    }
    const arrayOfFound = Array.from(resultFound);
    for (let data of arrayOfFound) {
      if (data.group === receiverToReplaceObject.deviceType) {
        return data;
      }
    }
  };
  const {
    handleSubmit,
    register,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      total: `${returnDeviceValue().value}`,
    },
  });
  const listOfDeviceInPool = useQuery({
    queryKey: ["deviceListOfPool"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: event.eventInfoDetail.eventName,
        provider: event.company,
      }),
  });

  const updateAssignedDeviceMutation = useMutation({
    mutationFn: (updatedObjectToPass) =>
      devitrakApi.patch(
        `/receiver/receiver-update/${updatedObjectToPass.id}`,
        updatedObjectToPass
      ),
  });
  const groupingByCompany = _.groupBy(
    listOfDeviceInPool.data?.data?.receiversInventory,
    "provider"
  );
  const findRightDataInEvent = () => {
    const eventCompanyData = groupingByCompany[user.company];

    if (eventCompanyData) {
      const eventGroup = _.groupBy(eventCompanyData, "eventSelected");
      const eventData = eventGroup[event.eventInfoDetail.eventName];

      if (eventData) {
        return eventData;
      }
    }
  };

  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );

  if (listOfDeviceInPool.isLoading) return <p>Loading...</p>;
  if (listOfDeviceInPool.data) {
    //! missing some props to pass
    // const reportActivityInLog = async () => {
    //   await devitrakApi.post("/transaction-audit-log/create-audit", {
    //     transaction: paymentIntentReceiversAssigned.at(-1).paymentIntent,
    //     user: user.email,
    //     actionTaken: `Device:${receiverToReplaceObject.serialNumber}, type: ${receiverToReplaceObject.deviceType
    //       } lost and a total lost fee of:$${localStorage.getItem(
    //         "total"
    //       )} was collected in cash by ${user.email}`,
    //     time: new Date(),
    //   });
    // };
    const changeStatusInPool = async () => {
      let findTheOneInUsed;
      let findDeviceInPool = _.groupBy(findRightDataInEvent(), "device");
      if (findDeviceInPool[receiverToReplaceObject.serialNumber]) {
        findTheOneInUsed = findDeviceInPool[
          receiverToReplaceObject.serialNumber
        ].find((element) => element.activity === true);
      }
      await devitrakApi.patch(
        `/receiver/receivers-pool-update/${findTheOneInUsed.id}`,
        {
          id: findTheOneInUsed.id,
          activity: false,
          comment: "Device lost",
          status: "Lost",
        }
      );

      const objectReturnIssueProfile = {
        ...findTheOneInUsed,
        activity: false,
        comment: "Device lost",
        status: "Lost",
        user: customer?.email,
        admin: user?.email,
        timeStamp: Date.now(),
      };
      devitrakApi.post(
        "/receiver/receiver-returned-issue",
        objectReturnIssueProfile
      );
    };

    const verifyPaymentIntentReceiversAssignedFormat = () => {
      if (Array.isArray(paymentIntentReceiversAssigned)) {
        return paymentIntentReceiversAssigned;
      } else {
        return [paymentIntentReceiversAssigned];
      }
    };
    const changeStatusInDeviceAssignedData = async () => {
      // const checkIndex = verifyPaymentIntentReceiversAssignedFormat()[0]?.device.findIndex(
      //   (item) => item.serialNumber === receiverToReplaceObject.serialNumber
      // );
      // const updateObject = verifyPaymentIntentReceiversAssignedFormat()[0]?.device.with(
      //   checkIndex,
      //   {
      //     deviceType: receiverToReplaceObject.deviceType,
      //     serialNumber: receiverToReplaceObject.serialNumber,
      //     status: "Lost",
      //   }
      // );

      const assignedDeviceProfile = {
        id: verifyPaymentIntentReceiversAssignedFormat()[0].id,
        device: {
          ...verifyPaymentIntentReceiversAssignedFormat()[0].device,
          status: "Lost",
        },
      };
      updateAssignedDeviceMutation.mutate(assignedDeviceProfile);
      if (
        (updateAssignedDeviceMutation.isIdle ||
          updateAssignedDeviceMutation.isSuccess) &&
        !updateAssignedDeviceMutation.isError
      ) {
        changeStatusInPool();
      }
    };
    const triggerStripePaymentIntent = async (data) => {
      localStorage.setItem("total", data.total);
      refTotal.current = watch("total");
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
        event: choice,
        company: company,
        typeCollection: "Credit Card",
      };

      await changeStatusInDeviceAssignedData();
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
          device: `${receiverToReplaceObject.deviceType} - ${receiverToReplaceObject.serialNumber}`,
          amount: refTotal.current,
          event: event.eventInfoDetail.eventName,
          company: event.company,
          date: dateSplitting.slice(0, 4),
          time: dateSplitting[4],
          transaction:
            verifyPaymentIntentReceiversAssignedFormat()[0].paymentIntent,
          link: `https://app.devitrak.net/authentication/${encodeURI(
            event.eventInfoDetail.eventName
          )}/${encodeURI(event.company)}/${customer.uid}`,
        });
        navigator(
          `/events/event-attendees/${customer.uid}/transactions-details`
        );
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
      localStorage.setItem("total", "");
      refRender.current = 1;
      navigator(`/events/event-attendees/${customer.uid}/transactions-details`);
    }

    const handleBackAction = () => {
      dispatch(onAddPaymentIntentSelected(""));
      navigator(`/events/event-attendees/${customer.uid}/transactions-details`);
    };
    return (
      <>
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
            container
          >
            <Grid
              display={"flex"}
              alignItems={"center"}
              justifyContent={"flex-start"}
              item
              xs={12}
              sm={12}
              md={12}
              lg={3}
            >
              <Typography
                textTransform={"none"}
                style={TextFontsize18LineHeight28}
              >
                Credit card transaction for lost device
              </Typography>
            </Grid>
            <Grid
              display={"flex"}
              alignItems={"center"}
              justifyContent={"flex-end"}
              gap={"10px"}
              margin={`${(isSmallDevice || isMediumDevice) && "0 0 2dvh 0"}`}
              item
              xs={12}
              sm={12}
              md={12}
              lg={9}
            >
              <p
                style={{
                  width: "fit-content",
                  color: "#000",
                  fontSize: "14px",
                  fontWeight: "600",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                  textTransform: "none",
                }}
              >
                Serial number
              </p>
              <OutlinedInput
                disabled
                value={receiverToReplaceObject.serialNumber}
                style={OutlinedInputStyle}
              />
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
              <OutlinedInput
                disabled={blocking}
                id="outlined-adornment-amount"
                style={{ ...OutlinedInputStyle, width: "fit-content" }}
                startAdornment={
                  <InputAdornment position="start">$</InputAdornment>
                }
                {...register("total", { required: true })}
                name="total"
              />
              {errors?.total && (
                <Alert message="Amount is required" type="error" />
              )}
              <Button style={GrayButton} onClick={() => handleBackAction()}>
                <Typography textTransform={"none"} style={GrayButtonText}>
                  Cancel
                </Typography>
              </Button>{" "}
              <Button
                disabled={clientSecret !== ""}
                style={{
                  ...BlueButton,
                  backgroundColor: `${
                    clientSecret === ""
                      ? BlueButton.background
                      : LightBlueButton.background
                  }`,
                  border: `${
                    clientSecret === ""
                      ? BlueButton.border
                      : LightBlueButton.border
                  }`,
                }}
                type="submit"
              >
                <Typography textTransform={"none"} style={BlueButtonText}>
                  Add CC information
                </Typography>
              </Button>
            </Grid>
            {/* <Grid
              display={"flex"}
              alignItems={"center"}
              justifyContent={"flex-end"}
              gap={"10px"}
              margin={`${(isSmallDevice || isMediumDevice) && "0 0 2dvh 0"}`}
              item
              xs={12}
              sm={12}
              md={4}
              lg={3}
            >
            </Grid>
            <Grid
              display={"flex"}
              alignItems={"center"}
              justifyContent={"flex-end"}
              gap={2}
              item
              xs={12}
              sm={12}
              md={3}
              lg={2}
            >
            </Grid> */}
          </Grid>
        </form>
        <Grid item xs={12}>
          {clientSecret !== "" && (
            <LostDeviceStripeElement
              clientSecret={clientSecret}
              total={watch("total")}
              customerStripeId={customer.uid}
              customer={customer}
            />
          )}
        </Grid>{" "}
      </>
    );
  }
};

export default CreditCard;
