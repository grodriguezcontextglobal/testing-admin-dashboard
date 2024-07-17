import { Icon } from "@iconify/react/dist/iconify.js";
import { Grid, InputAdornment, OutlinedInput } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Alert, Button, Divider } from "antd";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import { EditIcon } from "../../../../components/icons/Icons";
import { onAddPaymentIntentSelected } from "../../../../store/slices/stripeSlice";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import CardRendered from "../../../inventory/utils/CardRendered";
import CardActionsButton from "../CardActionsButton";
import ConsumerDetailInformation from "../ConsumerDetailInformation";
import ConsumerDetailInfoCntact from "../ConsumerDetailinfoContact";
import { LostDeviceStripeElement } from "../../../../components/stripe/elements/LostDeviceStripeElement";
import { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import _ from "lodash";
const ConsumerDeviceLostFeeCreditCard = () => {
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
    const { deviceSetup } = event;
    const result = deviceSetup.find(
      (element) => element.group === receiverToReplaceObject.deviceType
    );
    return result;
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
      navigator(`/events/event-attendees/${customer.uid}/transactions-details`);
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
    navigator(`/consumers/${customer.uid}`);
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
      <Grid
        style={{
          display: "flex",
          justifyContent: "space-between",
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
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <p style={{ ...TextFontSize30LineHeight38, textTransform: "none" }}>
            Consumer
          </p>
          <Link to="/event/new_subscription">
            <button
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
              <p
                style={{
                  color: "var(--base-white, #FFF",
                  fontSize: "14px",
                  fontWeight: "600",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                }}
              >
                Add new event
              </p>
            </button>
          </Link>
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
      >
        <Grid marginY={0} item xs={8}>
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            item
            xs={12}
          >
            <button
              style={{
                backgroundColor: "transparent",
                outline: "none",
                margin: 0,
                padding: 0,
              }}
              onClick={() => handleBackAction()}
            >
              <p
                style={{
                  ...TextFontsize18LineHeight28,
                  textTransform: "capitalize",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--blue-dark-600, #155EEF)",
                  cursor: "pointer",
                }}
              >
                All consumers
              </p>
            </button>
            <p
              style={{
                ...TextFontsize18LineHeight28,
                textTransform: "capitalize",
                textAlign: "left",
                fontWeight: 600,
                color: "var(--gray-900, #101828)",
              }}
            >
              <Icon icon="mingcute:right-line" />
              {customer?.name} {customer?.lastName}
            </p>{" "}
          </Grid>
        </Grid>
        <Grid textAlign={"right"} item xs={4}></Grid>
      </Grid>
      <Divider />
      <Grid
        gap={"5px"}
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
        alignSelf={"flex-start"}
        container
      >
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          item
          xs={12}
          sm={12}
          md={4}
          lg={4}
        >
          <ConsumerDetailInformation />
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          alignSelf={"flex-start"}
          item
          xs={12}
          sm={12}
          md={4}
          lg={4}
        >
          <ConsumerDetailInfoCntact />
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          alignSelf={"flex-start"}
          item
          xs={12}
          sm={12}
          md={3}
          lg={3}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <button
              style={{
                outline: "none",
                display: "flex",
                padding: "10px 16px",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
                borderRadius: "8px",
                border: "1px solid var(--Blue-dark-50, #EFF4FF)",
                background: "var(--Blue-dark-50, #EFF4FF)",
              }}
            >
              <EditIcon />
              <p
                style={{
                  color: "var(--Blue-dark-700, #004EEB)",
                  fontFamily: "Inter",
                  fontSize: "14px",
                  fontStyle: "normal",
                  fontWeight: "600",
                  lineHeight: "20px",
                }}
              >
                Edit
              </p>
            </button>
          </div>
        </Grid>
      </Grid>
      <Divider />{" "}
      <Grid alignSelf={"flex-start"} item xs={12} sm={12} md={6} lg={6}>
        <CardRendered
          title={"Group"}
          props={"No group provided"}
          optional={null}
        />
      </Grid>
      <Grid alignSelf={"flex-start"} item xs={12} sm={12} md={6} lg={6}>
        <CardActionsButton />
      </Grid>
      <Divider />{" "}
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
            <p style={TextFontsize18LineHeight28}>
              Credit card transaction for lost device
            </p>
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
            md={4}
            lg={3}
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
            md={4}
            lg={3}
          >
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
              style={OutlinedInputStyle}
              startAdornment={
                <InputAdornment position="start">$</InputAdornment>
              }
              {...register("total", { required: true })}
              name="total"
            />
            {errors?.total && (
              <Alert message="Amount is required" type="error" />
            )}
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
            <Button style={GrayButton} onClick={() => handleBackAction()}>
              <p style={GrayButtonText}>Cancel</p>
            </Button>{" "}
            <Button style={BlueButton} type="submit">
              <p style={BlueButtonText}>Add CC information</p>
            </Button>
          </Grid>
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
    </Grid>
  );
};

export default ConsumerDeviceLostFeeCreditCard;
