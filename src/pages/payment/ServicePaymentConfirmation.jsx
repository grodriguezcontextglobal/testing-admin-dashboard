import { Button, Grid, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Result, notification } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import Loading from "../../components/animation/Loading";
import { onAddNewPaymentIntent } from "../../store/slices/stripeSlice";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import CenteringGrid from "../../styles/global/CenteringGrid";
import clearCacheMemory from "../../utils/actions/clearCacheMemory";

const ServicePaymentConfirmation = () => {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [triggerStatus, setTriggerStatus] = useState(true);
  const { deviceSelectionPaidTransaction } = useSelector(
    (state) => state.devicesHandle
  );
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const { customer } = useSelector((state) => state.stripe);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
  const saveTransaction = async () => {
    let sequency = true;
    if (sequency) {
      const resp = await devitrakApi.post("/stripe/stripe-transaction-admin", {
        paymentIntent: payment_intent,
        clientSecret,
        device: 0,
        provider: event.company,
        eventSelected: event.eventInfoDetail.eventName,
        user: customer.uid ?? customer.id,
        company: user.companyData.id,
        type: "event",
      });
      if (resp) {
        const transactionProfile = {
          paymentIntent: payment_intent,
          clientSecret,
          device: [
            {
              deviceNeeded: 0,
              deviceType: deviceSelectionPaidTransaction.deviceType.group,
              deviceValue: deviceSelectionPaidTransaction.deviceType.value,
            },
          ],
          consumerInfo: {
            ...customer,
            uid: customer.uid ?? customer.id,
            id: customer.id ?? customer.uid,
          },
          provider: event.company,
          eventSelected: event.eventInfoDetail.eventName,
          event_id: event.id,
          company: user.companyData.id,
          date: new Date(),
          type: "event",
        };
        const responseTransaction = await devitrakApi.post(
          "/transaction/save-transaction",
          transactionProfile
        );
        await clearCacheMemory(
          `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`
        );
        await clearCacheMemory(
          `eventSelected=${event.id}&company=${user.companyData.id}`
        );
    
        if (responseTransaction.data) return (sequency = false);
      }
    }
  };

  const invoiceEmail = async (props) => {
    const template = {
      email: customer.email,
      amount: String(props.amount).slice(0, -2),
      date: Date().toString().slice(4, 33),
      paymentIntent: props.id,
      customer: `${customer.name} ${customer.lastName}`,
      service: deviceSelectionPaidTransaction.deviceType.group,
    };
    return await devitrakApi.post("/nodemailer/invoice-notification", template);
  };

  const confirmPaymentIntent = async () => {
    try {
      setLoadingStatus(true);
      const response = await devitrakApi.get(
        `/stripe/payment_intents/${payment_intent}`
      );
      if (response.data) {
        dispatch(onAddNewPaymentIntent(response.data));
        await invoiceEmail(response.data.paymentIntent);
        await saveTransaction();
        openNotification(
          "success",
          "Payment successful!",
          "Service stored into account."
        );
        queryClient.invalidateQueries({
          queryKey: ["transactionPerConsumerListQuery"],
          exact: true,
        });
        queryClient.invalidateQueries({
          queryKey: ["transactionsList"],
          exact: true,
        });
        setLoadingStatus(false);
        return setTriggerStatus(false);
      }
    } catch (error) {
      return setLoadingStatus(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    if (triggerStatus) {
      confirmPaymentIntent();
    }
    return () => {
      controller.abort();
    };
  }, []);

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
};

export default ServicePaymentConfirmation;
