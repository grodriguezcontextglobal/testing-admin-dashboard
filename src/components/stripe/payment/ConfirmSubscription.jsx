/* eslint-disable no-unused-vars */
import { Button, Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Result } from "antd";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import {
  onAddNewSubscription,
  onAddSubscriptionRecord,
} from "../../../store/slices/subscriptionSlice";
import { checkArray } from "../../utils/checkArray";
// import "../../style/pages/admin/confirmedPaymentAdmin.css";
const ConfirmSubscription = () => {
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const setup_intent = new URLSearchParams(window.location.search).get(
    "setup_intent"
  );
  const setup_intent_client_secret = new URLSearchParams(
    window.location.search
  ).get("setup_intent_client_secret");

  const stripeCustomerInfoQuery = useQuery({
    queryKey: ["stripeCustomerInfo"],
    queryFn: () =>
      devitrakApi.post("/stripe/setup-search", {
        setupId: setup_intent,
      }),
    enabled: false,
    refetchOnMount: false,
  });
  useEffect(() => {
    if (setup_intent.length < 1) return null;
    stripeCustomerInfoQuery.refetch();
  }, [setup_intent, setup_intent_client_secret]);

  console.log(stripeCustomerInfoQuery?.data?.data);

  const renderingStatus = (props) => {
    const status = {
      trialing: true,
      completed: true,
      active: true,
      canceled: false,
    };
    return status[props];
  };
  const savingSubscriptionInformation = async () => {
    const subscriptionInfo = checkArray(
      stripeCustomerInfoQuery.data.data.subscription
    );
    const subscriptionResponse = await devitrakApi.post(
      "/subscription/new_subscription",
      {
        company: user.company,
        record: [
          {
            subscription_id: subscriptionInfo.id,
            active: renderingStatus(subscriptionInfo.status),
            cancel_at: subscriptionInfo.cancel_at,
            created_at: subscriptionInfo.created,
            subscription_type: subscriptionInfo.plan.interval,
          },
        ],
      }
    );
    dispatch(
      onAddSubscriptionRecord([
        {
          subscription_id: subscriptionInfo.id,
          active: renderingStatus(subscriptionInfo.status),
          cancel_at: subscriptionInfo.cancel_at,
          created_at: subscriptionInfo.created,
          subscription_type: subscriptionInfo.plan.interval,
        },
      ])
    );
    dispatch(onAddNewSubscription(subscriptionResponse.data));
  };

  useEffect(() => {
    const controller = new AbortController();
    savingSubscriptionInformation();
    return () => {
      controller.abort();
    };
  }, [stripeCustomerInfoQuery.data]);

  if (stripeCustomerInfoQuery.data) {
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
        <Grid item xs={10}>
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
                subTitle={`Subscription id: ${stripeCustomerInfoQuery.data.data.subscription.id} Now you can click in return button to return to home page.`}
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                extra={[
                  <Button
                    style={{
                      width: "fit-content",
                      border: "1px solid var(--blue-dark-600, #155EEF)",
                      borderRadius: "8px",
                      background: "var(--blue-dark-600, #155EEF)",
                      boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                    }}
                    onClick={() => navigate("/")}
                    key="console"
                  >
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
                      Return to main page
                    </Typography>
                  </Button>,
                ]}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    );
  }
};

export default ConfirmSubscription;
