import { Box, Grid, Tab, Tabs } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Divider } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../api/devitrakApi";
import {
  onAddNewSubscription,
  onAddSubscriptionRecord,
} from "../../store/slices/subscriptionSlice";
import DescriptionFormat from "../events/newEventProcess/subscription/components/DescriptionFormat";
import OptionSubscriptionTitle from "../events/newEventProcess/subscription/components/OptionSubscriptionTitle";
import PricingTable from "../events/newEventProcess/subscription/table/PricingTable";
import ModalPayment from "./company/ModalPayment";

const SubscriptionMainPage = () => {
  const { user } = useSelector((state) => state.admin);
  const [value, setValue] = useState(0);
  const [clientSecret, setClientSecret] = useState(null);
  const [type, setType] = useState(null);
  const [total, setTotal] = useState(0);
  const dispatch = useDispatch();
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  const checkEventsPerCompany = useQuery({
    queryKey: ["eventsPerCompany"],
    queryFn: () =>
      devitrakApi.post("/event/event-list", {
        company: user.company,
      }),
    refetchOnMount: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    checkEventsPerCompany.refetch();

    return () => {
      controller.abort();
    };
  }, []);

  const eventsList = checkEventsPerCompany?.data?.data?.list;
  const handleSubmitEventPayment = async (props) => {
    if (props !== "00") {
      const resp = await devitrakApi.post("/stripe/create-subscriptions", {
        stripeCustomerID: user.sqlInfo.stripeID,
        items: [{ price: props }],
        period: value > 0 ? "year" : "month",
      });
      if (resp.data.ok) {
        await devitrakApi.post("/subscription/new_subscription", {
          company: user.company,
          stripeCompanyID: user.companyData.stripe_customer_id,
          record: [
            {
              subscription_id: resp.data.data.id,
              active: false,
              cancel_at: resp.data.data.cancel_at,
              created_at: resp.data.data.created,
              subscription_type: value > 0 ? "year" : "month",
            },
          ],
        });
        dispatch(
          onAddSubscriptionRecord([
            {
              subscription_id: resp.data.subscriptionId,
              active: false,
              cancel_at: resp.data.data.cancel_at,
              subscription_type: value > 0 ? "year" : "month",
              created_at: resp.data.created,
            },
          ])
        );
        dispatch(onAddNewSubscription(resp.data.data));
        setClientSecret(resp.data.clientSecret);
        setType(resp.data.type);
      }
    }
  };

  return (
    <div>
      <Grid
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        container
      >
        <Grid
          display={"flex"}
          flexDirection={"column"}
          justifyContent={"center"}
          alignItems={"center"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={11}
        >
          <p
            style={{
              textTransform: "none",
              color: "#000",
              fontSize: "14px",
              fontWeight: 600,
              fontFamily: "Inter",
              lineHeight: "20px",
              marginBottom: 2,
            }}
          >
            Pricing
          </p>
          <p
            style={{
              textTransform: "none",
              color: "#000",
              fontSize: "30px",
              fontWeight: 600,
              fontFamily: "Inter",
              lineHeight: "38px",
              marginBottom: 2,
            }}
          >
            Upgrade your plan
          </p>
          <p
            style={{
              textTransform: "none",
              color: "#000",
              fontSize: "14px",
              fontWeight: 400,
              fontFamily: "Inter",
              lineHeight: "20px",
              marginBottom: 3,
            }}
          >
            To use our extended features please update to the plan that suits
            your needs.
          </p>
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Tabs
              style={{
                background: "#e4e4e4",
                width: "fit-content",
                borderRadius: "12px",
              }}
              value={value}
              onChange={handleChange}
              centered
            >
              <Tab
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "fit-content",
                  background: `${value === 0 ? "#fff" : "#e4e4e4"}`,
                  border: `${
                    value === 0 ? "solid 1px #000" : "solid 1px #e4e4e4"
                  }`,
                  borderRadius: "12px 0 0 12px",
                }}
                label={
                  <p
                    style={{
                      textTransform: "none",
                      color: "#000",
                      fontSize: "14px",
                      fontWeight: 400,
                      fontFamily: "Inter",
                      lineHeight: "20px",
                    }}
                  >
                    Monthly billing
                  </p>
                }
              />
              <Tab
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "fit-content",
                  background: `${value === 0 ? "#e4e4e4" : "#fff"}`,
                  border: `${
                    value === 0 ? "solid 1px #e4e4e4" : "solid 1px #000"
                  }`,
                  borderRadius: "0px 12px 12px 0px",
                }}
                label={
                  <p
                    style={{
                      textTransform: "none",
                      color: "#000",
                      fontSize: "14px",
                      fontWeight: 400,
                      fontFamily: "Inter",
                      lineHeight: "20px",
                    }}
                  >
                    Annual billing
                  </p>
                }
              />
            </Tabs>
          </Box>
          <OptionSubscriptionTitle />
          <PricingTable
            eventsList={eventsList}
            handleSubmitEventPayment={handleSubmitEventPayment}
            value={value}
            setValue={setValue}
            total={total}
            setTotal={setTotal}
          />
          <Divider style={{ margin: "5px 0px" }} />
          <DescriptionFormat />
        </Grid>
      </Grid>
      {clientSecret?.length > 0 && (
        <ModalPayment
          setClientSecret={setClientSecret}
          clientSecret={clientSecret}
          type={type}
          total={total}
          title={
            value === 0 ? "Monthly subscription." : "Annually subscription."
          }
        />
      )}
    </div>
  );
};

export default SubscriptionMainPage;
