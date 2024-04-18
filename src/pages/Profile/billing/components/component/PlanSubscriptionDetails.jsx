import { Chip, Grid, Typography } from "@mui/material";
import { Card, Progress } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
// import UpdatingSubscription from "../payment/UpdatingSubscription";
import { useMediaQuery } from "@uidotdev/usehooks";
import _ from 'lodash';
import { devitrakApi } from "../../../../../api/devitrakApi";
import { Subtitle } from "../../../../../styles/global/Subtitle";
const PlanSubscriptionDetails = () => {
  const [openCancelOptionsModal, setOpenCancelOptionsModal] = useState(false);
  const [updatingSubscriptionModal, setUpdatingSubscriptionModal] =
    useState(false);
  const [details, setDetails] = useState([])
  const [subscriptionDetailFetched, setSubscriptionDetailFetched] = useState(null)
  const { subscriptionRecord } = useSelector((state) => state.subscription);
  const retrieveSubscriptionPerCompany = async () => {
    if (subscriptionRecord.company) {
      const responseSubs = await devitrakApi.post(`/subscription/search_subscription`, { company: subscriptionRecord.company })
      return setSubscriptionDetailFetched(responseSubs.data.subscription)
    }
  }
  retrieveSubscriptionPerCompany()
  const renderActiveSubscriptionDetail = useCallback(async () => {
    if (!subscriptionDetailFetched) {
      const groupingActive = _.groupBy(subscriptionRecord.record, 'active')
      const active = groupingActive[true]
      if (active) {
        const response = await devitrakApi.get(`/subscription/subscriptions/${active[0].subscription_id}`)
        if (response.data.ok) {
          return setDetails(response.data.subscriptions)
        }
      }
    }
  }, [subscriptionRecord.company, details])

  useEffect(() => {
    const controller = new AbortController()
    retrieveSubscriptionPerCompany()
    renderActiveSubscriptionDetail()
    return () => {
      controller.abort()
    }
  }, [subscriptionRecord?.record])

  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 993px) and (max-width : 1200px)"
  );
  const renderPlan = (amount) => {
    const dic = {
      3000: 'Business',
      6000: "Enterprises",
      32000: 'Business',
      72000: 'Enterprise'
    }
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
        {amount ? dic[amount] : 'Unknown'}
      </Typography>
    );
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
                  style={{ ...Subtitle, padding: "16px 24px", color: "#fd5656" }}
                >
                  Cancel plan
                </Typography>
              </div>

              <Typography
                onClick={() => setUpdatingSubscriptionModal(true)}
                style={{ ...Subtitle, color: "#004EEB", padding: "16px 24px" }}
              >
                Upgrade plan
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
                      {renderPlan(details?.plan?.amount)} plan{" "}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Chip
                      size="small"
                      variant="elevated"
                      label={details?.plan?.interval}
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
                {details?.plan?.amount?.toString()
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
                {details?.plan?.interval}
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
      {/* {updatingSubscriptionModal && (
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
      )} */}
    </>
  );
};

export default PlanSubscriptionDetails;
