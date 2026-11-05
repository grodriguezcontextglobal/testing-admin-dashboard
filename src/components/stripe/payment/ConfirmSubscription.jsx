/* eslint-disable no-unused-vars */
import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Result } from "antd";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import {
  onAddNewSubscription,
  onAddSubscriptionRecord,
} from "../../../store/slices/subscriptionSlice";
import { checkArray } from "../../utils/checkArray";
import BlueButtonComponent from "../../UX/buttons/BlueButton";
// import "../../style/pages/admin/confirmedPaymentAdmin.css";
const SUBSCRIPTION_ACTIVE_BY_STATUS = {
  trialing: true,
  completed: true,
  active: true,
  canceled: false,
};
const renderingStatus = (status) => SUBSCRIPTION_ACTIVE_BY_STATUS[status];

const ConfirmSubscription = () => {
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const setup_intent = new URLSearchParams(window.location.search).get(
    "setup_intent"
  );

  // Stripe sends the person back here with ?setup_intent=…; without it there
  // is nothing to look up.
  const stripeCustomerInfoQuery = useQuery({
    queryKey: ["stripeCustomerInfo", setup_intent],
    queryFn: () =>
      devitrakApi.post("/stripe/setup-search", {
        setupId: setup_intent,
      }),
    enabled: Boolean(setup_intent),
    refetchOnMount: false,
  });

  // Saves the subscription once it is known, once per page visit. It used to
  // run on mount too, before the data arrived, and threw reading it.
  const subscriptionData = stripeCustomerInfoQuery.data?.data?.subscription;
  const company = user.company;
  const saved = useRef(false);
  useEffect(() => {
    if (!subscriptionData || saved.current) return;
    saved.current = true;
    const subscriptionInfo = checkArray(subscriptionData);
    const record = {
      subscription_id: subscriptionInfo.id,
      active: renderingStatus(subscriptionInfo.status),
      cancel_at: subscriptionInfo.cancel_at,
      created_at: subscriptionInfo.created,
      subscription_type: subscriptionInfo.plan.interval,
    };
    const savingSubscriptionInformation = async () => {
      const subscriptionResponse = await devitrakApi.post(
        "/subscription/new_subscription",
        {
          company,
          record: [record],
        }
      );
      dispatch(onAddSubscriptionRecord([record]));
      dispatch(onAddNewSubscription(subscriptionResponse.data));
    };
    savingSubscriptionInformation().catch((error) =>
      console.error("Saving the subscription:", error)
    );
  }, [subscriptionData, company, dispatch]);

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
                  <BlueButtonComponent
                    onClick={() => navigate("/")}
                    key="console"
                  >
                    Return to main page
                  </BlueButtonComponent>,
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
