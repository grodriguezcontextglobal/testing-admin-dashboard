import { Icon } from "@iconify/react";
import { InputAdornment, Grid } from "@mui/material";
import HeaderDynamicComponent from "../../UX/header/HeaderDynamicComponent";
import { useQuery } from "@tanstack/react-query";
import { Divider, Result } from "antd";
import { useInterval } from "interval-hooks";
import { groupBy } from "lodash";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";

import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../apis/devitrakApi";
import FormatAttendeeDetailInfo from "../../components/admin/Attendees/quickGlancePerAttendee/FormatAttendeeDetailInfo";
import FormatToDisplayDetail from "../../components/admin/Attendees/quickGlancePerAttendee/FormatToDisplayDetail";
import { onAddNewPaymentIntent } from "../../store/slices/stripeSlice";
import "./ConfirmationPayment.css";
import Input from "../../UX/inputs/Input";
import BlueButtonComponent from "../../UX/buttons/BlueButton";
import { WhiteCirclePlusIcon } from "../../icons/WhiteCirclePlusIcon";


// import DeviceAssigned from "../../../classes/deviceAssigned";
const ConfirmationPaymentPage = () => {
  const { event } = useSelector((state) => state.event);
  const { deviceSelection, deviceSelectionPaidTransaction } = useSelector(
    (state) => state.devicesHandle
  );
  const { customer } = useSelector((state) => state.stripe);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { register, watch, setValue } = useForm();
  const ref = useRef(false);
  const payment_intent = new URLSearchParams(window.location.search).get(
    "payment_intent"
  );
  const clientSecret = new URLSearchParams(window.location.search).get(
    "payment_intent_client_secret"
  );
  const stripePaymentIntentQuery = useQuery({
    queryKey: ["listOfPaymentIntent"],
    queryFn: () =>
      devitrakApi.get("/stripe-transactions-saved-list", {
        paymentIntent: payment_intent,
      }),
  });
  const checkDeviceInUseInOtherCustomerInTheSameEventQuery = useQuery({
    queryKey: ["devicesAssignedList"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: event.eventInfoDetail.eventName,
        provider: event.company,
        paymentIntent: payment_intent,
      }),
  });

  const listOfTransactionsQuery = useQuery({
    queryKey: ["transactionList"],
    queryFn: () =>
      devitrakApi.post("/transaction/transaction", {
        eventSelected: event.eventInfoDetail.eventName,
        provider: event.company,
        paymentIntent: payment_intent,
      }),
  });
  const findingPaymentIntent = () => {
    if (stripePaymentIntentQuery.data) {
      const groupingByCompany = groupBy(
        stripePaymentIntentQuery.data.data.stripeTransactions,
        "provider"
      );
      if (groupingByCompany[event.company]) {
        const groupingByEvent = groupBy(
          groupingByCompany[event.company],
          "eventSelected"
        );
        const eventData = groupingByEvent[event.eventInfoDetail.eventName];
        if (eventData) {
          const found = groupBy(eventData, "paymentIntent");
          return found;
        }
        return [];
      }
      return [];
    }
    return [];
  };

  const findingTransaction = () => {
    if (listOfTransactionsQuery.data) {
      const groupingByCompany = groupBy(
        listOfTransactionsQuery.data.data.list,
        "provider"
      );
      if (groupingByCompany[event.company]) {
        const groupingByEvent = groupBy(
          groupingByCompany[event.company],
          "eventSelected"
        );
        const eventData = groupingByEvent[event.eventInfoDetail.eventName];
        if (eventData) {
          const found = groupBy(eventData, "paymentIntent");
          return found;
        }
        return [];
      }
      return [];
    }
    return [];
  };

  const createFormatForDevicesToBeStoredInTransactionDocument = () => {
    const finalFormat = new Set();
    const countingPerDeviceGroup = {};
    for (let data of deviceSelectionPaidTransaction) {
      if (!countingPerDeviceGroup[data.group]) {
        countingPerDeviceGroup[data.group] = {
          deviceNeeded: 1,
          deviceType: data.group,
          deviceValue: Number(data.value),
        };
      } else {
        countingPerDeviceGroup[data.group].deviceNeeded += 1;
      }
    }
    // eslint-disable-next-line no-unused-vars
    for (let [_, value] of Object.entries(countingPerDeviceGroup)) {
      finalFormat.add({ ...value });
    }
    return Array.from(finalFormat);
  };

  const formatToDeviceInAssignedReceiverInDocumentInDB = async () => {
    if (ref.current) {
      for (let data of deviceSelectionPaidTransaction) {
        await devitrakApi.post("/receiver/receiver-assignation", {
          paymentIntent: payment_intent,
          device: {
            serialNumber: data.serialNumber,
            deviceType: data.group,
            status: true,
          },
          active: true,
          timeStamp: new Date().getTime(),
          eventSelected: event.eventInfoDetail.eventName,
          provider: event.company,
          user: customer.email,
          event_id: event.id,
        });
      }
      return (ref.current = false);
    }
  };

  const checkIfDeviceIsInUsed = () => {
    if (checkDeviceInUseInOtherCustomerInTheSameEventQuery.data) {
      const groupingByCompany = groupBy(
        checkDeviceInUseInOtherCustomerInTheSameEventQuery.data.data
          .receiversInventory,
        "provider"
      );
      if (groupingByCompany[event.company]) {
        const groupingBYEvent = groupBy(
          groupingByCompany[event.company],
          "eventSelected"
        );
        const eventData = groupingBYEvent[event.eventInfoDetail.eventName];
        if (eventData) return eventData;
        return [];
      }
      return [];
    }
    return [];
  };
  checkIfDeviceIsInUsed();
  // const createDevicesInPool =
  useMemo(async () => {
    if (checkIfDeviceIsInUsed().length > 0) {
      const groupingByDevice = groupBy(checkIfDeviceIsInUsed(), "device");
      for (let data of deviceSelectionPaidTransaction) {
        if (groupingByDevice[data.serialNumber]) {
          await devitrakApi.patch(
            `/receiver/receivers-pool-update/${
              groupingByDevice[data.serialNumber].at(-1).id
            }`,
            { activity: true, status: "Operational" }
          );
        }
      }
    }
  }, [payment_intent, checkIfDeviceIsInUsed().length]); /// eslint-disable-line react-hooks/exhaustive-deps

  // const saveTransaction =
  useMemo(async () => {
    const resp = await devitrakApi.post("/stripe/stripe-transaction-admin", {
      paymentIntent: payment_intent,
      clientSecret,
      device: deviceSelection,
      provider: event.company,
      eventSelected: event.eventInfoDetail.eventName,
      user: customer?.uid,
    });
    if (resp) {
      const transactionProfile = {
        paymentIntent: payment_intent,
        clientSecret,
        device: createFormatForDevicesToBeStoredInTransactionDocument(), //*subtract devices group/value/qty needed
        consumerInfo: customer,
        provider: event.company,
        eventSelected: event.eventInfoDetail.eventName,
        event_id: event.id,
        date: new Date(),
      };
      await devitrakApi.post("/stripe/save-transaction", transactionProfile);
    }
  }, [payment_intent]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirmPaymentIntent = useCallback(async () => {
    try {
      const response = await devitrakApi.get(
        `/stripe/payment_intents/${payment_intent}`
      );
      if (response) {
        dispatch(onAddNewPaymentIntent(response.data));
        ref.current = true;
      }
    } catch (error) {
      return null;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    confirmPaymentIntent();
    formatToDeviceInAssignedReceiverInDocumentInDB();
  }, [payment_intent, clientSecret]); // eslint-disable-line react-hooks/exhaustive-deps
  const removeDuplicatesStripePaymentIntent = () => {
    const checkingDuplicates = {};
    if (findingPaymentIntent()[payment_intent]?.length > 1) {
      const values = findingPaymentIntent()[payment_intent];
      for (let data of values) {
        if (!checkingDuplicates[data.paymentIntent]) {
          checkingDuplicates[data.paymentIntent] = data;
        } else {
          devitrakApi.delete(`/stripe/remove-duplicate/${data.id}`);
        }
      }
    }
  };
  const removeDuplicatesTransaction = () => {
    const checkingDuplicates = {};
    if (findingTransaction()[payment_intent]?.length > 1) {
      const values = findingTransaction()[payment_intent];
      for (let data of values) {
        if (!checkingDuplicates[data.paymentIntent]) {
          checkingDuplicates[data.paymentIntent] = data;
        } else {
          devitrakApi.delete(
            `/transaction/remove-duplicate-transaction/${data.id}`
          );
        }
      }
    }
  };

  useInterval(() => {
    removeDuplicatesStripePaymentIntent();
    removeDuplicatesTransaction();
  }, [100]);

  const handleBackAction = () => {
    navigate(`/events/event-attendees/${customer.uid}`);
  };
  return (
    <div className="confirmation-payment-container">
      <div className="confirmation-payment-content">
        <HeaderDynamicComponent
          title="Events"
          subtitle={event.eventInfoDetail.address}
          breadcrumbs={[
            { name: "All events", onClick: handleBackAction },
            {
              name: event.eventInfoDetail.eventName,
              onClick: () =>
                navigate(
                  `/events/event-detail/${event.eventInfoDetail.eventName}`
                ),
            },
            {
              name: `${customer?.name} ${customer?.lastName}`,
              onClick: () =>
                navigate(`/consumers/${customer?.uid}`),
            },
          ]}
          actions={{
            desktop: (
              <BlueButtonComponent
                href="/create-event-page/event-detail"
                icon={<WhiteCirclePlusIcon />}
                title="Add new event"
              />
            ),
            mobile: (
              <BlueButtonComponent
                href="/create-event-page/event-detail"
                icon={<WhiteCirclePlusIcon />}
              />
            ),
          }}
        />
        <Divider />
        <Grid container>
          <Grid item xs={12}>
            <FormatAttendeeDetailInfo />
          </Grid>
          <Grid item xs={12}>
            <FormatToDisplayDetail />
          </Grid>
        </Grid>
        <Divider />{" "}
        <Grid
          marginY={3}
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          gap={1}
          container
        >
          <Grid textAlign={"right"} item xs></Grid>
          <Grid justifyContent={"right"} alignItems={"center"} item xs={3}>
            <Input
              {...register("searchEvent")}
              fullWidth
              placeholder="Search a transaction here"
              startAdornment={
                <InputAdornment position="start">
                  <Icon
                    icon="radix-icons:magnifying-glass"
                    color="#344054"
                    width={20}
                    height={19}
                  />
                </InputAdornment>
              }
              endAdornment={
                <InputAdornment position="end">
                  <Icon
                    cursor={"pointer"}
                    icon="ic:baseline-delete-forever"
                    color="#1e73be"
                    width="25"
                    height="25"
                    opacity={`${watch("searchEvent")?.length > 0 ? 1 : 0}`}
                    onClick={() => {
                      setValue("searchEvent", "");
                    }}
                  />
                </InputAdornment>
              }
            />
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
          <Grid
            border={"1px solid var(--gray-200, #eaecf0)"}
            borderRadius={"12px 12px 0 0"}
            display={"flex"}
            alignItems={"center"}
            marginBottom={-2}
            paddingBottom={-2}
            item
            xs={12}
          >
            <Result
              status="success"
              title="Successfully transaction!"
              subTitle={`Order number: ${payment_intent} Now you can click in return button to return to consumer page.`}
              extra={[
                <BlueButtonComponent
                  onClick={() => navigate("/events/event-attendees")}
                  key="console"
                  title="Return to event main page"
                />,
                <BlueButtonComponent
                  onClick={() => handleBackAction()}
                  key="consumer"
                  title="Return to consumer page"
                />,
              ]}
            />
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export default ConfirmationPaymentPage;
