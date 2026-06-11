import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Spin } from "antd";
import { lazy, Suspense, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import Loading from "../../components/animation/Loading";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import { onAddCompanyAccountStripe } from "../../store/slices/adminSlice";
import {
  onResetEventInfo
} from "../../store/slices/eventSlice";
import CenteringGrid from "../../styles/global/CenteringGrid";
import { TextFontSize20LineHeight30 } from "../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../styles/global/TextFontSize30LineHeight38";
import { useEventHook } from "./hook/useEventHook";
const CardEventDisplay = lazy(() => import("./components/CardEventDisplay"));
const PastEventsTable = lazy(() => import("./components/PastEventsTable"));
const BannerMsg = lazy(() => import("./utils/BannerMsg"));
const BannerNoEventStaffOnly = lazy(() =>
  import("../../components/utils/BannerNoEventStaffOnly")
);
const MainPage = () => {
  const [eventList, setEventList] = useState([]);
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const { isLoading, isRefetching } = useQuery({
    queryKey: ["events"],
    queryFn: () =>
      devitrakApi.get(
        `/event/event-list-per-company?company=${user.company}&type=event`
      ),
    enabled: !!user.companyData.id,
    onSuccess: (data) => {
      setEventList(data?.data?.list);
    },
  });
  const companyAccountStripeQuery = useQuery({
    queryKey: ["stripe_company_account"],
    queryFn: () =>
      devitrakApi.post(`/stripe/company-account-stripe`, {
        company: user.companyData.company_name,
      }),
    refetchOnMount: false,
  });

  const {
    dataToBeRenderedInUpcomingSection,
    renderingDataBasedOnStaffAndActiveEvent,
    checkActiveEventsToRemoveDuplicates
  } = useEventHook({
    eventList,
  });
  if (isLoading || isRefetching) {
    return (
      <Spin indicator={<Loading />} fullscreen />
    )
  }
  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
      <Grid
        alignSelf={"flex-start"}
        style={{
          padding: "px",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
        container
      >
        <Grid
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          container
        >
          <Grid
            sx={{
              display: { xs: "flex", sm: "flex", md: "none", lg: "none" },
            }}
            textAlign={"center"}
            justifyContent={"center"}
            alignItems={"center"}
            margin={"0.5rem auto 0"}
            gap={1}
            marginY={2}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            {/* /event/new_subscription */}
            <Link
              to="/create-event-page/event-detail"
              style={{
                width: "100%",
              }}
            >
              <BlueButtonComponent
                title={"Add new event"}
                func={() =>
                  dispatch(
                    dispatch(
                      onAddCompanyAccountStripe(
                        companyAccountStripeQuery.data.data
                          .companyAccountStripeFound
                      )
                    )
                  )
                }
                // icon={<WhiteCirclePlusIcon />}
                styles={{ width: "100%" }}
              />
            </Link>
          </Grid>
          <Grid
            sx={{
              display: { xs: "none", sm: "none", md: "flex", lg: "flex" },
            }}
            justifyContent={"space-between"}
            alignItems={"center"}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <Typography
              style={{ ...TextFontSize30LineHeight38, textAlign: "left" }}
            >
              Events
            </Typography>
            {/* /event/new_subscription */}
            <Link to="/create-event-page/event-detail">
              {" "}
              <BlueButtonComponent
                title={"Add new event"}
                func={() => {
                  dispatch(
                    onAddCompanyAccountStripe(
                      companyAccountStripeQuery.data.data
                        .companyAccountStripeFound
                    )
                  )
                  dispatch(onResetEventInfo())
                }}
                // icon={<WhiteCirclePlusIcon />}
                styles={{ width: "100%" }}
              />
            </Link>
          </Grid>
        </Grid>
        <Grid
          marginY={3}
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          gap={1}
          container
        >
          <Grid marginY={0} item xs={12} sm={6} md={12} lg={12}>
            <Typography
              style={{
                ...TextFontSize20LineHeight30,
                textAlign: "left",
                width: "100%",
                fontWeight: 600,
                color: "#344054",
              }}
            >
              Scheduled events
            </Typography>
            <Typography
              style={{ ...Subtitle, textAlign: "left", width: "100%" }}
            >
              Here are all the upcoming and active events.
            </Typography>
          </Grid>
        </Grid>
        <Grid marginY={3} container spacing={1}>
          {dataToBeRenderedInUpcomingSection()?.length > 0 ? (
            dataToBeRenderedInUpcomingSection()?.map((event) => {
              // console.log('event', event)
              return (
                <Grid
                  key={event.id}
                  padding={1}
                  item
                  xs={12}
                  sm={12}
                  md={12}
                  lg={6}
                >
                  <CardEventDisplay props={event} />
                </Grid>
              );
            })
          ) : (
            <>
              {Number(user.role) < 4 ? (
                <BannerMsg />
              ) : (
                <BannerNoEventStaffOnly
                  props={{
                    title: "No event",
                    message:
                      "There is not active events where you are assigned as staff member.",
                  }}
                />
              )}
            </>
          )}
        </Grid>
        {renderingDataBasedOnStaffAndActiveEvent()?.length > 0 && (
          <>
            {" "}
            <Grid
              marginY={3}
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              gap={1}
              container
            >
              <Grid marginY={0} item xs={12} sm={6} md={6} lg={6}>
                <Typography
                  style={{
                    ...TextFontSize20LineHeight30,
                    textAlign: "left",
                    width: "100%",
                    fontWeight: 600,
                    color: "#344054",
                  }}
                >
                  Past events
                </Typography>
                <Typography
                  style={{ ...Subtitle, textAlign: "left", width: "100%" }}
                >
                  Here are all the past events that have now concluded.
                </Typography>
              </Grid>
            </Grid>
            <Grid
              marginY={3}
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              gap={1}
              container
            >
              <Grid
                style={CenteringGrid}
                item
                xs={12}
                sm={12}
                md={12}
                lg={12}
              >
                <PastEventsTable
                  events={checkActiveEventsToRemoveDuplicates().reverse()}
                />
              </Grid>
            </Grid>
          </>
        )}{" "}
      </Grid>
    </Suspense>
  );
}
// };

export default MainPage;
