import { Box, Grid, Tab, Tabs, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Divider, message } from "antd";
import _ from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import {
  onAddNewSubscription,
  onAddSubscriptionRecord,
} from "../../../../store/slices/subscriptionSlice";
import DescriptionFormat from "./components/DescriptionFormat";
import ModalAnnualPayment from "./components/ModalAnnualPayment";
import ModalMonthlyPayment from "./components/ModalMonthlyPayment";
import OptionSubscriptionTitle from "./components/OptionSubscriptionTitle";
import PricingTable from "./table/PricingTable";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import Loading from "../../../../components/animation/Loading";
const Main = () => {
  const { user } = useSelector((state) => state.admin);
  const [value, setValue] = useState(0);
  const [clientSecret, setClientSecret] = useState(null);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const checkEventsPerCompany = useQuery({
    queryKey: ["eventsPerCompany"],
    queryFn: () =>
      devitrakApi.post("/event/event-list", {
        company: user.company,
      }),
    // enabled: false,
    refetchOnMount: false,
  });
  let searchingExistingSubscriptionRecord = useRef([]);
  const checkExistingCompanyRecord = useCallback(async () => {
    const check = await devitrakApi.post("/subscription/search_subscription", {
      company: user.company,
    });
    if (check.data.ok) {
      const result = await check.data.subscription;
      return (searchingExistingSubscriptionRecord.current = result);
    }
  }, []);
  checkExistingCompanyRecord();

  const recordStored = (props) => {
    if (props.length > 0) {
      return props;
    } else {
      const result = new Set();
      const original = searchingExistingSubscriptionRecord.current.record;
      if (original) {
        for (let data of original) {
          result.add({
            active: data.status === "active" ? true : false,
          });
        }
        return Array.from(result);
      }
    }
  };
  const checkSubscriptionInStripe = useCallback(async () => {
    const reference = searchingExistingSubscriptionRecord.current.record;
    const checkRecord = new Set();
    if (reference?.length > 0) {
      for (let index = 0; index < reference.length; index++) {
        const check = await devitrakApi.get(
          `/subscription/subscriptions/${reference[index].subscription_id}`
        );
        checkRecord.add({
          subscription_id: check.data.subscriptions.id,
          active: check.data.subscriptions.status === "active" ? true : false,
          cancel_at: check.data.subscriptions.cancel_at,
          created_at: check.data.subscriptions.created,
          subscription_type:
            check.data.subscriptions.items.data[0].plan.interval,
        });
      }
    }
    await devitrakApi.patch(
      `/subscription/update-subscription/${searchingExistingSubscriptionRecord.current.id}`,
      {
        newSubscriptionData: {
          company: user.company,
          record: recordStored(Array.from(checkRecord)),
        },
      }
    );
    return dispatch(
      onAddSubscriptionRecord(recordStored(Array.from(checkRecord)))
    );
  }, [searchingExistingSubscriptionRecord.current.length, user.company]);
  checkSubscriptionInStripe();
  const [messageApi, contextHolder] = message.useMessage();
  const success = () => {
    messageApi.open({
      type: "info",
      content:
        "Company has an active subscription. Process to create a new event.",
    });
  };
  const eventsList = checkEventsPerCompany?.data?.data?.list;
  const checkSubscriptionRecordAfterCheckInStripe = useCallback(() => {
    const groupingByActiveSubscription = _.groupBy(
      searchingExistingSubscriptionRecord.current.record,
      "active"
    );
    return groupingByActiveSubscription;
  }, [searchingExistingSubscriptionRecord.current.length]);
  checkSubscriptionRecordAfterCheckInStripe();

  useEffect(() => {
    const controller = new AbortController();
    checkEventsPerCompany.refetch();

    return () => {
      controller.abort();
    };
  }, []);

  const sequencyActions = async () => {
    await success();
    await navigate("/create-event-page/event-detail", { replace: true });
    return;
  };
  if (checkSubscriptionRecordAfterCheckInStripe()[true]) {
    sequencyActions();
    return (
      <div style={CenteringGrid} onClick={success()}>
        {contextHolder}
        <Loading />
      </div>
    );
  } else {
    const handleSubmitEventPayment = async (props) => {
      if (props !== "00") {
        const resp = await devitrakApi.post("/stripe/create-subscriptions", {
          stripeCustomerID: user.sqlInfo.stripeID.stripe_id,
          items: [{ price: props }],
          period: value > 0 ? "year" : "month",
        });
        if (resp.data.ok) {
          if (searchingExistingSubscriptionRecord.current.company) {
            const recordTemplate = {
              subscription_id: resp.data.data.id,
              active: false,
              cancel_at: resp.data.data.cancel_at,
              created_at: resp.data.data.created,
              subscription_type: value > 0 ? "year" : "month",
            };
            const updateResponse = await devitrakApi.patch(
              `/subscription/update-subscription/${searchingExistingSubscriptionRecord.current.id}`,
              {
                newSubscriptionData: {
                  company: user.company,
                  record: [
                    recordTemplate,
                    ...searchingExistingSubscriptionRecord.current.record,
                  ],
                },
              }
            );
            dispatch(
              onAddSubscriptionRecord(updateResponse.data.subscription.record)
            );
            dispatch(onAddNewSubscription(resp.data.data));
            setClientSecret(resp.data.clientSecret);
            return;
          } else {
            await devitrakApi.post("/subscription/new_subscription", {
              company: user.company,
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
            return;
          }
        }
      } else {
        return navigate("/create-event-page/event-detail");
      }
    };
    const handleChange = (event, newValue) => {
      setValue(newValue);
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
            <Typography
              textTransform={"none"}
              color={"#000"}
              fontSize={"14px"}
              fontWeight={600}
              fontFamily={"Inter"}
              lineHeight={"20px"}
              marginBottom={2}
            >
              Pricing
            </Typography>
            <Typography
              textTransform={"none"}
              color={"#000"}
              fontSize={"30px"}
              fontWeight={600}
              fontFamily={"Inter"}
              lineHeight={"38px"}
              marginBottom={2}
            >
              Upgrade your plan
            </Typography>
            <Typography
              textTransform={"none"}
              color={"#000"}
              fontSize={"14px"}
              fontWeight={400}
              fontFamily={"Inter"}
              lineHeight={"20px"}
              marginBottom={3}
            >
              To use our extended features please update to the plan that suits
              your needs.
            </Typography>
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
                    <Typography
                      textTransform={"none"}
                      color={"#000"}
                      fontSize={"14px"}
                      fontWeight={400}
                      fontFamily={"Inter"}
                      lineHeight={"20px"}
                    >
                      Monthly billing
                    </Typography>
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
                    <Typography
                      textTransform={"none"}
                      color={"#000"}
                      fontSize={"14px"}
                      fontWeight={400}
                      fontFamily={"Inter"}
                      lineHeight={"20px"}
                    >
                      Annual billing
                    </Typography>
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
        {clientSecret?.length > 0 &&
          (value === 0 ? (
            <ModalMonthlyPayment
              setClientSecret={setClientSecret}
              clientSecret={clientSecret}
              total={total}
            />
          ) : (
            <ModalAnnualPayment
              setClientSecret={setClientSecret}
              clientSecret={clientSecret}
              total={total}
            />
          ))}
      </div>
    );
  }
};

export default Main;
