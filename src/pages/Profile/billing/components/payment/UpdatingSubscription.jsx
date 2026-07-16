import { Box, Grid, Tab, Tabs, Typography } from "@mui/material";
import { Button, Modal } from "antd";
import { useState, useRef } from "react";
import subscriptionList from "../../../../../components/json/subscriptionList.json";
import OptionSubscriptionTitle from "../../../../events/newEventProcess/subscription/components/OptionSubscriptionTitle";
import DescriptionFormat from "../../../../events/newEventProcess/subscription/components/DescriptionFormat";
import ModalMonthlyPayment from "../../../../events/newEventProcess/subscription/components/ModalMonthlyPayment";
import ModalAnnualPayment from "../../../../events/newEventProcess/subscription/components/ModalAnnualPayment";
const UpdatingSubscription = ({
  updatingSubscriptionModal,
  setUpdatingSubscriptionModal,
}) => {
  const [value, setValue] = useState(0);
  const [clientSecret, setClientSecret] = useState(null);
  const [total] = useState(0);

  const amountSubTierDisplay = useRef({
    month: "",
    year: "",
  });

  const closeModal = () => {
    setUpdatingSubscriptionModal(false);
  };
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  const renderTitle = () => {
    return (
      <Typography
        width={"100%"}
        textTransform={"none"}
        color="var(--gray-900, #171d1a)"
        lineHeight={"28px"}
        textAlign={"left"}
        fontWeight={600}
        fontFamily={"Inter"}
        fontSize={"18px"}
        noWrap={true}
      >
        Updating subscription
      </Typography>
    );
  };
  return (
    <Modal
      title={renderTitle()}
      style={{
        top: 20,
      }}
      open={updatingSubscriptionModal}
      onOk={() => closeModal()}
      onCancel={() => closeModal()}
      footer={[]}
      width={1000}
      maskClosable = {false}
    >
      <Grid container>
        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          marginY={2}
          gap={2}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
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
                background: "var(--gray-200, #ddded6)",
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
                  background: `${
                    value === 0 ? "#fff" : "var(--gray-200, #ddded6)"
                  }`,
                  border: `solid 1px ${
                    value === 0
                      ? "var(--gray-300, #c6c7bb)"
                      : "var(--gray-200, #ddded6)"
                  }`,
                  borderRadius: "12px 0 0 12px",
                }}
                label={
                  <Typography
                    textTransform={"none"}
                    color={"var(--gray-900, #171d1a)"}
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
                  background: `${
                    value === 0 ? "var(--gray-200, #ddded6)" : "#fff"
                  }`,
                  border: `solid 1px ${
                    value === 0
                      ? "var(--gray-200, #ddded6)"
                      : "var(--gray-300, #c6c7bb)"
                  }`,
                  borderRadius: "0px 12px 12px 0px",
                }}
                label={
                  <Typography
                    textTransform={"none"}
                    color={"var(--gray-900, #171d1a)"}
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
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          item
          md={3}
          lg={3}
        ></Grid>
        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          gap={3}
          item
          xs={12}
          sm={12}
          md={9}
          lg={9}
        >
          {subscriptionList.subscriptionsList.map((item) => {
            return (
              <Button
                disabled={item.id === 1}
                key={`update-subscription-button-${item.id}`}
              >
                <Typography
                  fontFamily={"Inter"}
                  fontSize={"14px"}
                  fontStyle={"normal"}
                  fontWeight={600}
                  lineHeight={"20px"}
                  color="var(--action-600, #155eef)"
                >
                  Upgrade plan
                </Typography>
              </Button>
            );
          })}
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          item
          md={3}
          lg={3}
        ></Grid>
        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          gap={3}
          item
          xs={12}
          sm={12}
          md={9}
          lg={9}
        >
          {subscriptionList.subscriptionsList.map((item) => {
            switch (item.id) {
              case 2:
                amountSubTierDisplay.current = {
                  month: 30,
                  year: 360,
                };
                break;
              case 3:
                amountSubTierDisplay.current = {
                  month: 60,
                  year: 720,
                };
                break;
              default:
                amountSubTierDisplay.current = {
                  month: "00",
                  year: "00",
                };
                break;
            }

            return (
              <Box
                key={`subscription-amount-${item.id}`}
                sx={{ display: "flex", alignItems: "baseline", gap: "4px" }}
              >
                <Typography
                  textAlign={"left"}
                  fontSize={"28px"}
                  fontWeight={600}
                  lineHeight={"38px"}
                  fontFamily={"Inter"}
                >
                  $
                  {`${
                    value === 0
                      ? amountSubTierDisplay.current.month
                      : amountSubTierDisplay.current.year
                  }`}
                </Typography>
                &nbsp;
                <Typography
                  textAlign={"left"}
                  fontSize={"20px"}
                  fontWeight={400}
                  lineHeight={"28px"}
                  fontFamily={"Inter"}
                >
                  {`${value === 0 ? "per month" : "per year"}`}
                </Typography>
              </Box>
            );
          })}
        </Grid>
        <Grid item xs={12}>
          <OptionSubscriptionTitle />
        </Grid>
        <Grid item xs={12}>
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
    </Modal>
  );
};

export default UpdatingSubscription;
