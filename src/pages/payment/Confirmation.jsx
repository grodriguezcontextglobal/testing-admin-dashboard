import { Button, Grid, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Result, notification } from "antd";
import _ from 'lodash';
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import Loading from "../../components/animation/Loading";
import { onAddNewPaymentIntent } from "../../store/slices/stripeSlice";
import CenteringGrid from "../../styles/global/CenteringGrid";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";

const Confirmation = () => {
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [triggerStatus, setTriggerStatus] = useState(true)
  const [count, setCount] = useState(0)
  const { event } = useSelector((state) => state.event);
  const { deviceSelection, deviceSelectionPaidTransaction } = useSelector(
    (state) => state.devicesHandle
  );
  const { customer } = useSelector((state) => state.stripe);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient()
  const checkDeviceInUseInOtherCustomerInTheSameEventQuery = useQuery({
    queryKey: ["devicesAssignedList"],
    queryFn: () => devitrakApi.post("/receiver/receiver-pool-list", { eventSelected: event.eventInfoDetail.eventName, provider: event.company, activity: "No" }),
    refetchOnMount: false,
    cacheTime: 1000 * 60 * 2
  });

  const addingDeviceInTransactionMutation = useMutation({
    mutationFn: (template) => devitrakApi.post('/receiver/receiver-assignation', template)
  })
  const updateDeviceInPoolMutation = useMutation({
    mutationFn: (template) => devitrakApi.patch(`/receiver/receivers-pool-update/${template.id}`, { activity: "YES", status: "Operational" })
  })
  const payment_intent = new URLSearchParams(window.location.search).get(
    "payment_intent"
  );

  const clientSecret = new URLSearchParams(window.location.search).get(
    "payment_intent_client_secret"
  );
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, mess, descript) => {
    api.open({
      message: mess,
      description: descript,
      duration: 0,
    });
  };
  function handleBackAction() {
    return navigate(`/events/event-attendees/${customer.uid}/transactions-details`);
  }
  if (checkDeviceInUseInOtherCustomerInTheSameEventQuery.data) {
    const usedDevices = checkDeviceInUseInOtherCustomerInTheSameEventQuery.data.data.receiversInventory
    const groupingByDevice = _.groupBy(usedDevices, "device");

    const formatToDeviceInAssignedReceiverInDocumentInDB = async (props) => {
      let sequency = true
      if (sequency) {
        const deviceTemplate = {
          paymentIntent: payment_intent,
          device: {
            serialNumber: props,
            deviceType: deviceSelectionPaidTransaction.deviceType.group,
            status: true
          },
          active: true,
          timeStamp: new Date().getTime(),
          eventSelected: event.eventInfoDetail.eventName,
          provider: event.company,
          user: customer.email
        }
        const response = await addingDeviceInTransactionMutation.mutateAsync(deviceTemplate)
        if (response.data.ok) return sequency = false
      }
    }

    const createDeviceInPool = async (props) => {
      const device = await groupingByDevice[props].at(-1)
      if (device.id) {
        await updateDeviceInPoolMutation.mutateAsync(device)
        await usedDevices.findIndex(element => element.id === device.id)
      }
    }

    const saveTransaction = async () => {
      let sequency = true
      if (sequency) {
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
            device: [{
              deviceNeeded: deviceSelection,
              deviceType: deviceSelectionPaidTransaction.deviceType.group,
              deviceValue: deviceSelectionPaidTransaction.deviceType.value
            }],
            consumerInfo: customer,
            provider: event.company,
            eventSelected: event.eventInfoDetail.eventName,
            date: new Date(),
          };
          const responseTransaction = await devitrakApi.post("/stripe/save-transaction", transactionProfile);
          if (responseTransaction.data.ok) return sequency = false
        }
      }
    }

    const confirmPaymentIntent = async () => {
      try {
        setLoadingStatus(true)
        setTriggerStatus(false)
        setCount(count + 1)
        const response = await devitrakApi.get(
          `/stripe/payment_intents/${payment_intent}`
        );
        if (response.data.ok && count === 0) {
          dispatch(onAddNewPaymentIntent(response.data))
          await saveTransaction()
          if (deviceSelectionPaidTransaction.serialNumber && count === 0) {
            await formatToDeviceInAssignedReceiverInDocumentInDB(deviceSelectionPaidTransaction.serialNumber)
            await createDeviceInPool(deviceSelectionPaidTransaction.serialNumber)
          }
          if (deviceSelectionPaidTransaction.startingNumber && count === 0) {
            for (let index = Number(deviceSelectionPaidTransaction.startingNumber); index <= Number(deviceSelectionPaidTransaction.endingNumber); index++) {
              await formatToDeviceInAssignedReceiverInDocumentInDB(String(index).padStart(deviceSelectionPaidTransaction.startingNumber.length, `${deviceSelectionPaidTransaction.startingNumber[0]}`))
              await createDeviceInPool(String(index).padStart(deviceSelectionPaidTransaction.startingNumber.length, `${deviceSelectionPaidTransaction.startingNumber[0]}`))
            }
          }
          openNotification('success', 'Device assigned.', 'All device assigned into account.')
          queryClient.invalidateQueries(['transactionPerConsumerListQuery', 'assginedDeviceList'])
          setLoadingStatus(false)
        }
      } catch (error) {
        console.log(
          "🚀 ~ file: NoticePaymentTransactionConfirmed.js:54 ~ confirmPaymentIntent ~ error:",
          error
        );
        openNotification('error', 'Error.', 'Please try again later.')
        setLoadingStatus(false)
      }
    };

    if (triggerStatus && count === 0) { confirmPaymentIntent() }
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
        {contextHolder}
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
            justifyContent={'center'}
            marginBottom={-2}
            paddingBottom={-2}
            item
            xs={12} sm={12} md={12} lg={12}
          >
            {loadingStatus ? <div style={CenteringGrid}> <Loading /> </div> : <Result
              status="success"
              title="Successfully transaction!"
              subTitle={`Order number: ${payment_intent} Now you can click in return button to return to consumer page.`}
              extra={[
                <div key={'payment_confirmed_buttons'} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "2px" }}>
                  <Button style={{ ...BlueButton, width: "100%" }} onClick={() => navigate("/events/event-attendees")} key="console">
                    <Typography
                      textTransform={"none"}
                      style={BlueButtonText}
                    >Return to event main page</Typography>
                  </Button>
                  <Button style={{ ...BlueButton, width: "100%" }} onClick={() => handleBackAction()} key="consumer"><Typography
                    textTransform={"none"}
                    style={BlueButtonText}
                  >Return to consumer page</Typography></Button>
                </div>
              ]}
            />}
          </Grid>
        </Grid>
      </Grid>
    );

  }
};

export default Confirmation