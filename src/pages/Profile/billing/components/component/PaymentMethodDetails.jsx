import { Icon } from "@iconify/react";
import { Grid, Typography } from "@mui/material";
import { Button, Card } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import "./PaymentMethod.css";
import { useMediaQuery } from "@uidotdev/usehooks";
import UpdateCreditCard from "./UpdatingData/UpdateCreditCard";
const PaymentMethodDetails = () => {
  const [openUpdateCreditCardModal, setOpenUpdateCreditCardModal] =
    useState(false);
  const { companyAccountStripe } = useSelector((state) => state.admin);
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 993px) and (max-width : 1200px)"
  );

  const creditCardInfo = {
    last4: companyAccountStripe
      ? companyAccountStripe.subscriptionHistory?.at(-1)?.paymentIntent?.charges
          ?.data[0]?.payment_method_details?.card?.last4
      : "",
    network: companyAccountStripe
      ? companyAccountStripe?.subscriptionHistory?.at(-1)?.paymentIntent
          ?.charges?.data[0]?.payment_method_details?.card?.network
      : "",
    exp_month: companyAccountStripe
      ? companyAccountStripe?.subscriptionHistory?.at(-1)?.paymentIntent
          ?.charges?.data[0]?.payment_method_details?.card?.exp_month
      : "",
    exp_year: companyAccountStripe
      ? companyAccountStripe?.subscriptionHistory?.at(-1)?.paymentIntent
          ?.charges?.data[0]?.payment_method_details?.card?.exp_year
      : "",
    receipt_email: companyAccountStripe
      ? companyAccountStripe?.subscriptionHistory?.at(-1)?.paymentIntent
          ?.receipt_email
      : "",
  };
  const renderLogoFinancialInstitute = () => {
    switch (creditCardInfo.network) {
      case "mastercard":
        return (
          <Icon
            key={"mastercard"}
            icon="logos:mastercard"
            width={40}
            height={40}
          />
        );
      case "visa":
        return <Icon key={"visa"} icon="logos:visa" width={40} height={40} />;
      case "amex":
        return <Icon key={"amex"} icon="logos:amex" width={40} height={40} />;
      case "discover":
        return (
          <Icon key={"discover"} icon="logos:discover" width={40} height={40} />
        );
      case "diners":
        return (
          <Icon key={"diners"} icon="logos:dinersclub" width={40} height={40} />
        );
      case "unionpay":
        return (
          <Icon key={"unionpay"} icon="logos:unionpay" width={40} height={40} />
        );
      default:
        return (
          <Icon
            key={"negeral-creadicard"}
            icon="fxemoji:creditcard"
            width={40}
            height={40}
          />
        );
    }
  };

  return (
    <>
      <Grid
        key={``}
        padding={"8px 0px 8px 8px"}
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <Card
          key={``}
          style={{
            height: "20rem",
            borderRadius: "12px",
            border: "1px solid var(--gray-200, #EAECF0)",
            background: "var(--base-white, #FFF)",
            boxShadow:
              "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
          }}
        >
          <Grid
            display={"flex"}
            flexDirection={"column"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            marginX={"auto"}
            marginTop={1}
            container
          >
            <Typography
              width={"100%"}
              textTransform={"none"}
              color="var(--gray-900, #101828)"
              lineHeight={"28px"}
              textAlign={"left"}
              fontWeight={600}
              fontFamily={"Inter"}
              fontSize={"18px"}
              noWrap={true}
            >
              Payment method
            </Typography>
            <Typography
              width={"100%"}
              textTransform={"none"}
              color="var(--gray-600, #475467)"
              lineHeight={"20px"}
              textAlign={"left"}
              fontWeight={400}
              fontFamily={"Inter"}
              fontSize={"14px"}
              noWrap={true}
            >
              Change how you pay for your plan.
            </Typography>
            <Grid
              display={"flex"}
              justifyContent={"center"}
              alignItems={"center"}
              item
              xs={12}
              sm={12}
              md={12}
              lg={12}
            >
              {companyAccountStripe?.subscriptionHistory.length > 0 ? (
                <Card
                  id="inner"
                  type="inner"
                  style={{
                    width: "100vw",
                    margin: "20px 0px 0px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Grid
                    id="inner-1"
                    display={"flex"}
                    flexDirection={
                      isSmallDevice || isLargeDevice ? "column" : "row"
                    }
                    justifyContent={"space-between"}
                    alignItems={"center"}
                    width={"100%"}
                    item
                    xs={12}
                    sm={12}
                    md={12}
                    lg={12}
                  >
                    <Grid
                      id="inner-2"
                      display={"flex"}
                      justifyContent={
                        isSmallDevice || isLargeDevice ? "center" : "flex-start"
                      }
                      alignItems={"center"}
                      alignSelf={"stretch"}
                      margin={0}
                      item
                      xs={12}
                      sm={12}
                      md={3}
                    >
                      <span style={{ width: "100%", height: "100%" }}>
                        {renderLogoFinancialInstitute()}
                      </span>
                    </Grid>
                    <Grid
                      id="inner-3"
                      justifyContent={"space-between"}
                      item
                      xs={12}
                      sm={12}
                      md={6}
                    >
                      <Grid id="inner-4" item xs={12} sm={12} md={12}>
                        <Typography
                          width={"100%"}
                          textTransform={"none"}
                          color="var(--gray-600, #475467)"
                          lineHeight={"20px"}
                          textAlign={"left"}
                          fontWeight={400}
                          fontFamily={"Inter"}
                          fontSize={"14px"}
                          noWrap={true}
                        >
                          {creditCardInfo.network} ending in{" "}
                          {creditCardInfo.last4}
                        </Typography>
                      </Grid>
                      <Grid id="inner-5" item xs={12}>
                        <Typography
                          width={"100%"}
                          textTransform={"none"}
                          color="var(--gray-600, #475467)"
                          lineHeight={"20px"}
                          textAlign={"left"}
                          fontWeight={400}
                          fontFamily={"Inter"}
                          fontSize={"14px"}
                          noWrap={true}
                        >
                          Expiry {creditCardInfo.exp_month} /{" "}
                          {creditCardInfo.exp_year}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography
                          width={"100%"}
                          textTransform={"none"}
                          color="var(--gray-600, #475467)"
                          lineHeight={"20px"}
                          textAlign={"left"}
                          fontWeight={400}
                          fontFamily={"Inter"}
                          fontSize={"14px"}
                          noWrap={true}
                        >
                          <Icon icon="ic:outline-email" />
                          &nbsp;{creditCardInfo.receipt_email}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid alignItems={"center"} item md={3}>
                      <Button
                        onClick={() => setOpenUpdateCreditCardModal(true)}
                        style={{
                          width: "fit-content",
                          borderRadius: "8px",
                          border: "1px solid var(--gray-300, #D0D5DD)",
                          background: "var(--base-white, #FFF)",

                          /* Shadow/xs */
                          boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                        }}
                      >
                        <Typography
                          width={"100%"}
                          textTransform={"none"}
                          color="var(--gray-600, #475467)"
                          lineHeight={"20px"}
                          textAlign={"left"}
                          fontWeight={400}
                          fontFamily={"Inter"}
                          fontSize={"14px"}
                        >
                          Edit
                        </Typography>
                      </Button>
                    </Grid>
                  </Grid>
                </Card>
              ) : (
                <Typography
                  width={"100%"}
                  textTransform={"none"}
                  color="var(--gray-600, #475467)"
                  lineHeight={"20px"}
                  textAlign={"left"}
                  fontWeight={400}
                  fontFamily={"Inter"}
                  fontSize={"14px"}
                >
                  No payment method registered
                </Typography>
              )}
            </Grid>
          </Grid>
        </Card>
      </Grid>
      {openUpdateCreditCardModal && (
        <UpdateCreditCard
          openUpdateCreditCardModal={openUpdateCreditCardModal}
          setOpenUpdateCreditCardModal={setOpenUpdateCreditCardModal}
        />
      )}
    </>
  );
};

export default PaymentMethodDetails;
