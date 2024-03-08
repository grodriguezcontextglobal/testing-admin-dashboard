import { useState } from "react";
// import "../../style/component/subscription/subscriptionPage.css";
import { Box, Grid, Tab, Tabs, Typography } from "@mui/material";
import { Divider } from "antd";
// import "./Subscription.css";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { onAddNewSubscription } from "../../../../store/slices/subscriptionSlice";
import { devitrakApi } from "../../../../api/devitrakApi";
import OptionSubscriptionTitle from "./components/OptionSubscriptionTitle";
import PricingTable from "./table/PricingTable";
import DescriptionFormat from "./components/DescriptionFormat";
// import ModalMonthlyPayment from "./components/ModalMonthlyPayment";
// import ModalAnnualPayment from "./components/ModalAnnualPayment";
const Main = () => {
  const { companyAccountStripe } = useSelector((state) => state.admin);
  const [value, setValue] = useState(0);
  // const [clientSecret, setClientSecret] = useState(null);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const element = element => element.status === "active"
  if (companyAccountStripe?.subscriptionHistory.some(element)) {
    return <Navigate to={'/create-event-page/event-detail'} replace />
  } else {
    const handleSubmitEventPayment = async (props) => {
      if (props !== "00") {
        const resp = await devitrakApi.post("/stripe/create-subscriptions", {
          stripeCustomerID: companyAccountStripe.stripeID,
          items: [{ price: props }],
        });
        if (resp.data.ok) {
          dispatch(onAddNewSubscription(resp.data.data));
          // setClientSecret(resp.data.clientSecret);
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
            xs={12} sm={12} md={12} lg={11}
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
              To use our extended features please update to the plan that
              suits your needs.
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
                    border: `${value === 0 ? "solid 1px #000" : "solid 1px #e4e4e4"
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
                    border: `${value === 0 ? "solid 1px #e4e4e4" : "solid 1px #000"
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
        {/* {clientSecret?.length > 0 &&
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
            ))} */}
      </div>
    );
  }
};

export default Main