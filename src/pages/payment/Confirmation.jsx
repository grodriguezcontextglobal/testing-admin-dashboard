import { Button, Grid, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Result, notification } from "antd";
import _ from "lodash";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import Loading from "../../components/animation/Loading";
import { onAddNewPaymentIntent } from "../../store/slices/stripeSlice";
import CenteringGrid from "../../styles/global/CenteringGrid";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import { checkArray } from "../../components/utils/checkArray";

const Confirmation = () => {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [triggerStatus, setTriggerStatus] = useState(true);
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const { deviceSelection, deviceSelectionPaidTransaction } = useSelector(
    (state) => state.devicesHandle
  );
  const { customer } = useSelector((state) => state.stripe);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const checkDeviceInUseInOtherCustomerInTheSameEventQuery = useQuery({
    queryKey: ["devicesAssignedList"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: event.eventInfoDetail.eventName,
        company: user.companyData.id,
        activity: false,
      }),
    refetchOnMount: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    checkDeviceInUseInOtherCustomerInTheSameEventQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  const addingDeviceInTransactionMutation = useMutation({
    mutationFn: (template) =>
      devitrakApi.post("/receiver/receiver-assignation", template),
  });

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
    return navigate(
      `/events/event-attendees/${customer.uid}/transactions-details`
    );
  }
  if (checkDeviceInUseInOtherCustomerInTheSameEventQuery.data) {
    const usedDevices =
      checkDeviceInUseInOtherCustomerInTheSameEventQuery.data.data
        .receiversInventory;
    const groupingByDevice = _.groupBy(usedDevices, "device");

    const formatToDeviceInAssignedReceiverInDocumentInDB = async (props) => {
      let sequency = true;
      if (sequency) {
        const deviceTemplate = {
          paymentIntent: payment_intent,
          device: {
            serialNumber: props,
            deviceType: deviceSelectionPaidTransaction.deviceType.group,
            status: true,
          },
          active: true,
          timeStamp: new Date().getTime(),
          eventSelected: event.eventInfoDetail.eventName,
          provider: event.company,
          user: customer.email,
          company: user.companyData.id,
        };
        const response = await addingDeviceInTransactionMutation.mutateAsync(
          deviceTemplate
        );
        if (response.data.ok) return (sequency = false);
      }
    };
    const createDeviceInPool = async (props) => {
      const device = await checkArray(groupingByDevice[props]);
      if (device.id) {
        await devitrakApi.patch(
          `/receiver/receivers-pool-update/${device.id}`,
          {
            activity: true,
            status: "Operational",
          }
        );
      }
    };

    const saveTransaction = async () => {
      let sequency = true;
      if (sequency) {
        const resp = await devitrakApi.post(
          "/stripe/stripe-transaction-admin",
          {
            paymentIntent: payment_intent,
            clientSecret,
            device: deviceSelection,
            provider: event.company,
            eventSelected: event.eventInfoDetail.eventName,
            user: customer?.uid,
          }
        );
        if (resp) {
          const transactionProfile = {
            paymentIntent: payment_intent,
            clientSecret,
            device: [
              {
                deviceNeeded: deviceSelection,
                deviceType: deviceSelectionPaidTransaction.deviceType.group,
                deviceValue: deviceSelectionPaidTransaction.deviceType.value,
              },
            ],
            consumerInfo: customer,
            provider: event.company,
            eventSelected: event.eventInfoDetail.eventName,
            date: new Date(),
          };
          const responseTransaction = await devitrakApi.post(
            "/transaction/save-transaction",
            transactionProfile
          );
          if (responseTransaction.data.ok) return (sequency = false);
        }
      }
    };

    const confirmPaymentIntent = async () => {
      try {
        setLoadingStatus(true);
        setTriggerStatus(false);
        const response = await devitrakApi.get(
          `/stripe/payment_intents/${payment_intent}`
        );
        if (response.data.ok) {
          dispatch(onAddNewPaymentIntent(response.data));
          await saveTransaction();
          if (Number(deviceSelectionPaidTransaction.quantity) === 1) {
            await formatToDeviceInAssignedReceiverInDocumentInDB(
              deviceSelectionPaidTransaction.serialNumber
            );
            await createDeviceInPool(
              deviceSelectionPaidTransaction.serialNumber
            );
          } else {
            const copiedData = usedDevices;
            const deviceFound = usedDevices.findIndex(
              (element) =>
                element.device === deviceSelectionPaidTransaction.startingNumber
            );
            if (deviceFound > -1) {
              for (
                let index = deviceFound;
                index <=
                Number(deviceFound) +
                  Number(deviceSelectionPaidTransaction.quantity) -
                  1;
                index++
              ) {
                const argument = await checkArray(copiedData[index]);
                await formatToDeviceInAssignedReceiverInDocumentInDB(
                  argument.device
                );
                await createDeviceInPool(argument.device);
              }
            }
          }
          openNotification(
            "success",
            "Device assigned.",
            "All device assigned into account."
          );
          queryClient.invalidateQueries({
            queryKey: ["transactionPerConsumerListQuery"],
            exact: true,
          });
          queryClient.invalidateQueries({
            queryKey: ["assginedDeviceList"],
            exact: true,
          });
          queryClient.invalidateQueries({
            queryKey: ["transactionsList"],
            exact: true,
          });
          queryClient.invalidateQueries({
            queryKey: ["listOfDevicesAssigned"],
            exact: true,
          });
          queryClient.invalidateQueries({
            queryKey: ["listOfNoOperatingDevices"],
            exact: true,
          });
          setLoadingStatus(false);
        }
      } catch (error) {
        console.log(
          "🚀 ~ file: NoticePaymentTransactionConfirmed.js:54 ~ confirmPaymentIntent ~ error:",
          error
        );
        setLoadingStatus(false)
      }
    };

    if (triggerStatus) {
      confirmPaymentIntent();
    }
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
            justifyContent={"center"}
            marginBottom={-2}
            paddingBottom={-2}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            {loadingStatus ? (
              <div style={CenteringGrid}>
                {" "}
                <Loading />{" "}
              </div>
            ) : (
              <Result
                status="success"
                title="Successfully transaction!"
                subTitle={`Order number: ${payment_intent} Now you can click in return button to return to consumer page.`}
                extra={[
                  <div
                    key={"payment_confirmed_buttons"}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "2px",
                    }}
                  >
                    <Button
                      style={{ ...BlueButton, width: "100%" }}
                      onClick={() => navigate("/events/event-attendees")}
                      key="console"
                    >
                      <Typography textTransform={"none"} style={BlueButtonText}>
                        Return to event main page
                      </Typography>
                    </Button>
                    <Button
                      style={{ ...BlueButton, width: "100%" }}
                      onClick={() => handleBackAction()}
                      key="consumer"
                    >
                      <Typography textTransform={"none"} style={BlueButtonText}>
                        Return to consumer page
                      </Typography>
                    </Button>
                  </div>,
                ]}
              />
            )}
          </Grid>
        </Grid>
      </Grid>
    );
  }
};

export default Confirmation;
