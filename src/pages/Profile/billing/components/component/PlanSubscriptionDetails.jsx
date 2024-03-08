import { Icon } from "@iconify/react";
import { Chip, Grid, Typography } from "@mui/material";
import { Card, Progress, notification } from "antd";
import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import UpdatingSubscription from "../payment/UpdatingSubscription";
import { useMediaQuery } from "@uidotdev/usehooks";
import ModalCancelOptions from "./ModalCancelOptions";

const PlanSubscriptionDetails = () => {
  const [openCancelOptionsModal, setOpenCancelOptionsModal] = useState(false);
  const [updatingSubscriptionModal, setUpdatingSubscriptionModal] =
    useState(false);
  const { companyAccountStripe } = useSelector((state) => state.admin);
  let planTitle;

  const [api, contextHolder] = notification.useNotification();
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 993px) and (max-width : 1200px)"
  );
  // const openNotificationWithIcon = (type, msg, dscpt) => {
  //   api[type]({
  //     message: msg,
  //     description: dscpt,
  //   });
  // };

  // const [open, setOpen] = useState(false);
  // const [confirmLoading, setConfirmLoading] = useState(false);
  // const showPopconfirm = () => {
  //   setOpen(true);
  // };
  // const handleOk = async () => {
  //   setConfirmLoading(true);
  //   const subscriptionExposedId =
  //     companyAccountStripe.subscriptionHistory.at(-1).subscription;
  //   try {
  //     const respCancel = await devitrakApi.delete(
  //       `/stripe/subscriptions/${subscriptionExposedId}`,
  //       { subscriptionID: subscriptionExposedId }
  //     );
  //     if (respCancel.data.ok) {
  //       await devitrakApi.patch(
  //         `/stripe/updating-subscription/${
  //           companyAccountStripe.subscriptionHistory.at(-1).id
  //         }`,
  //         {
  //           subscriptionHistory: [
  //             ...companyAccountStripe.subscriptionHistory,
  //             {
  //               ...companyAccountStripe.subscriptionHistory.at(-1),
  //               status: "canceled",
  //             },
  //           ],
  //         }
  //       );
  //       openNotificationWithIcon(
  //         "success",
  //         "Subscription cancelled.",
  //         "Subscription will be active until its due date."
  //       );
  //       setOpen(false);
  //       setConfirmLoading(false);
  //     }
  //   } catch (error) {
  //     openNotificationWithIcon(
  //       "error",
  //       "Something went wrong!",
  //       "Please try later."
  //     );
  //     setOpen(false);
  //     setConfirmLoading(false);
  //   }
  // };

  const renderPlanTitle = useCallback(() => {
    if (companyAccountStripe) {
      switch (
        companyAccountStripe?.subscriptionHistory?.at(-1)?.paymentIntent?.amount
      ) {
        case "0000":
          planTitle = "Basic";
          break;
        case 3000:
          planTitle = "Business";
          break;
        case 6000:
          planTitle = "Enterprise";
          break;
        case 36000:
          planTitle = "Business";
          break;
        case 72000:
          planTitle = "Enterprise";
          break;
        default:
          planTitle = "No";
          break;
      }
    }
  }, []);

  const renderPlan = (props) => {
    return (
      <Typography
        width={"fit-content"}
        textTransform={"capitalize"}
        fontFamily={"Inter"}
        fontSize={"14px"}
        fontStyle={"normal"}
        fontWeight={500}
        lineHeight={"20px"}
        color="var(--primary-700, #6941C6)"
      >
        {props}
      </Typography>
    );
  };
  return (
    <>
      {contextHolder}
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
          actions={[
            <Grid
              key={"grid-card-home-action-footer"}
              item
              xs={12}
              display={"flex"}
              justifyContent={"flex-end"}
              alignItems={"center"}
              textAlign={"right"}
            >
              <div onClick={() => setOpenCancelOptionsModal(true)}>
                <Typography
                  fontFamily={"Inter"}
                  fontSize={"14px"}
                  fontStyle={"normal"}
                  fontWeight={600}
                  lineHeight={"20px"}
                  color="#fd5656"
                  padding={"16px 24px"}
                >
                  Cancel plan &nbsp;
                  <Icon icon="ic:outline-cancel" width={25} height={25} />
                </Typography>
              </div>

              <Typography
                onClick={() => setUpdatingSubscriptionModal(true)}
                fontFamily={"Inter"}
                fontSize={"14px"}
                fontStyle={"normal"}
                fontWeight={600}
                lineHeight={"20px"}
                color="#004EEB"
                padding={"16px 24px"}
              >
                Upgrade plan &nbsp;
                <Icon
                  icon="eva:diagonal-arrow-right-up-fill"
                  width={25}
                  height={25}
                />
              </Typography>
            </Grid>,
          ]}
        >
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            marginX={"auto"}
            marginTop={1}
            container
          >
            <Grid
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              item
              xs={6}
              sm={6}
              md={7}
            >
              <Grid
                display={"flex"}
                flexDirection={"column"}
                alignItems={"center"}
                item
                xs={12}
                sm={12}
                md={12}
                lg={12}
              >
                <Grid
                  display={"flex"}
                  justifyContent={"flex-start"}
                  flexDirection={"row"}
                  alignItems={"center"}
                  width={"100%"}
                  item
                  xs={12}
                  sm={12}
                  md={12}
                  lg={12}
                >
                  <Grid item xs={6}>
                    {" "}
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
                      {planTitle} plan{" "}
                    </Typography>
                  </Grid>
                  {planTitle !== "No" && (
                    <Grid item xs={6}>
                      <Chip
                        size="small"
                        variant="elevated"
                        label={renderPlan(
                          companyAccountStripe?.subscriptionHistory?.at(-1)
                            ?.latest_invoice?.lines?.data[0]?.plan?.interval
                        )}
                        style={{
                          width: "fit-content",
                          borderRadius: "16px",
                          background: "var(--primary-50, #F9F5FF)",
                          mixBlendMode: "multiply",
                          display: "flex",
                          alignItems: "center",
                        }}
                      />
                    </Grid>
                  )}
                </Grid>

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
                  style={{
                    textWrap: "balance",
                  }}
                >
                  Our most popular plan for small teams.
                </Typography>
              </Grid>
            </Grid>
            <Grid
              display={"flex"}
              flexDirection={isSmallDevice || isLargeDevice ? "column" : "row"}
              justifyContent={"flex-end"}
              alignItems={"center"}
              item
              xs={6}
              sm={6}
              md={5}
            >
              <Typography
                textTransform={"none"}
                color="var(--gray-900, #101828)"
                lineHeight={"60px"}
                textAlign={"center"}
                fontWeight={600}
                fontFamily={"Inter"}
                fontSize={"48px"}
                noWrap={true}
              >
                $
                {companyAccountStripe?.subscriptionHistory
                  ?.at(-1)
                  ?.paymentIntent?.amount?.toString()
                  ?.slice(0, -2)}
              </Typography>
              <Typography
                textTransform={"none"}
                color="#475467"
                lineHeight={"24px"}
                textAlign={"center"}
                fontWeight={500}
                fontFamily={"Inter"}
                fontSize={"16px"}
                noWrap={true}
              >
                per &nbsp;
                {
                  companyAccountStripe?.subscriptionHistory?.at(-1)
                    ?.latest_invoice?.lines?.data[0]?.plan?.interval
                }
              </Typography>
            </Grid>
            <Grid
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              item
              xs={12}
              paddingLeft={"18px"}
              paddingTop={"18px"}
              paddingBottom={"9px"}
            >
              <Progress percent={80} showInfo={false} />
            </Grid>
          </Grid>
        </Card>
      </Grid>
      {updatingSubscriptionModal && (
        <UpdatingSubscription
          updatingSubscriptionModal={updatingSubscriptionModal}
          setUpdatingSubscriptionModal={setUpdatingSubscriptionModal}
        />
      )}
      {openCancelOptionsModal && (
        <ModalCancelOptions
          openCancelOptionsModal={openCancelOptionsModal}
          setOpenCancelOptionsModal={setOpenCancelOptionsModal}
        />
      )}
    </>
  );
};

export default PlanSubscriptionDetails;
