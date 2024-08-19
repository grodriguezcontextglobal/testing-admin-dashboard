import { Button, Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import _ from "lodash";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import Loading from "../../components/animation/Loading";
import { WhitePlusIcon } from "../../components/icons/Icons";
import { onAddCompanyAccountStripe } from "../../store/slices/adminSlice";
import {
  onAddContactInfo,
  onAddDeviceSetup,
  onAddEventInfoDetail,
  onAddEventStaff,
  onAddListEventPermitPerAdmin,
} from "../../store/slices/eventSlice";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import CenteringGrid from "../../styles/global/CenteringGrid";
import { TextFontSize20LineHeight30 } from "../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../styles/global/TextFontSize30LineHeight38";
import CardEventDisplay from "./components/CardEventDisplay";
import PastEventsTable from "./components/PastEventsTable";
import BannerMsg from "./utils/BannerMsg";
import BannerNoEventStaffOnly from "../../components/utils/BannerNoEventStaffOnly";
const MainPage = () => {
  const { watch } = useForm();
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const eventQuery = useQuery({
    queryKey: ["events"],
    queryFn: () =>
      devitrakApi.post("/event/event-list", {
        company: user.company,
      }),
    // enabled: false,
    refetchOnMount: false,
  });
  const companyAccountStripeQuery = useQuery({
    queryKey: ["stripe_company_account"],
    queryFn: () =>
      devitrakApi.post(`/stripe/company-account-stripe`, {
        company: user.companyData.company_name,
      }),
    refetchOnMount: false,
  });

  useEffect(() => {
    const triggerDispatchWhenUserLandingInPage = () => {
      dispatch(
        onAddEventInfoDetail({
          eventName: undefined,
          eventLocation: undefined,
          address: undefined,
          building: undefined,
          floor: undefined,
          phoneNumber: [],
          merchant: false,
          dateBegin: new Date().toString(),
          dateEnd: new Date().toString(),
        })
      );
      dispatch(onAddContactInfo(undefined));
      dispatch(
        onAddEventStaff({
          adminUser: [],
          headsetAttendees: [],
        })
      );
      dispatch(onAddDeviceSetup([]));
    };
    triggerDispatchWhenUserLandingInPage();
    eventQuery.refetch();
  }, [user.company]);
  if (eventQuery.isLoading)
    return (
      <div style={CenteringGrid}>
        <Loading />
      </div>
    );
  if (eventQuery.data || eventQuery.isRefetching) {
    const dataPerCompany = () => {
      if (watch("searchEvent")?.length > 0) {
        const check = eventQuery?.data?.data?.list?.filter(
          (item) =>
            item?.eventInfoDetail?.eventName
              ?.toLowerCase()
              .includes(watch("searchEvent").toLowerCase()) &&
            item.company === user.company
        );
        return check;
      }
      const groupOfCompanies = eventQuery?.data?.data?.list;
      if (groupOfCompanies) return groupOfCompanies;
      return undefined;
    };
    dataPerCompany();
    const renderingDataBasedOnStaffAndActiveEvent = () => {
      const companyData = dataPerCompany();

      if (!companyData) return [];

      const groupByActive = _.groupBy(companyData, "active");

      const filterEventsByEmail = (events, key) =>
        events?.filter((event) =>
          event.staff?.[key]?.some((member) => member.email === user.email)
        ) || [];

      const activeAdminEvents = filterEventsByEmail(
        groupByActive.true,
        "adminUser"
      );
      const activeHeadsetEvents = filterEventsByEmail(
        groupByActive.true,
        "headsetAttendees"
      );
      const activeEvents = [...activeAdminEvents, ...activeHeadsetEvents];

      const inactiveAdminEvents = filterEventsByEmail(
        groupByActive.false,
        "adminUser"
      );

      dispatch(
        onAddListEventPermitPerAdmin({
          active: activeEvents,
          completed: inactiveAdminEvents,
        })
      );

      const combinedEvents = [...activeEvents, ...inactiveAdminEvents];
      const uniqueEvents = _.uniqBy(combinedEvents, (event) =>
        JSON.stringify(event)
      );

      return uniqueEvents;
    };
    renderingDataBasedOnStaffAndActiveEvent();

    const dataToBeRenderedInUpcomingSection = () => {
      const result = new Set();
      for (let data of renderingDataBasedOnStaffAndActiveEvent()) {
        const currentDate = new Date();
        const begin = new Date(`${data.eventInfoDetail.dateBegin}`);
        let ending = new Date(`${data.eventInfoDetail.dateEnd}`);
        if (
          (data.active && currentDate < begin) ||
          (data.active && currentDate >= begin && currentDate <= ending)
        ) {
          result.add({ key: data.id, ...data });
        }
      }
      const sortedResult = Array.from(result);
      return sortedResult.sort(
        (a, b) => a.eventInfoDetail.dateBegin - b.eventInfoDetail.dateBegin
      );
    };

    return (
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
            sx={{ display: { xs: "flex", sm: "flex", md: "none", lg: "none" } }}
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
              <Button
                onClick={() =>
                  dispatch(
                    dispatch(
                      onAddCompanyAccountStripe(
                        companyAccountStripeQuery.data.data
                          .companyAccountStripeFound
                      )
                    )
                  )
                }
                style={{ ...BlueButton, width: "100%" }}
              >
                <WhitePlusIcon />
                <Typography style={BlueButtonText}>Add new event</Typography>
              </Button>
            </Link>
          </Grid>
          <Grid
            sx={{ display: { xs: "none", sm: "none", md: "flex", lg: "flex" } }}
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
              <Button
                onClick={() =>
                  dispatch(
                    dispatch(
                      onAddCompanyAccountStripe(
                        companyAccountStripeQuery.data.data
                          .companyAccountStripeFound
                      )
                    )
                  )
                }
                style={{ ...BlueButton, display: user.role === "4" && "none" }}
              >
                <WhitePlusIcon />
                <Typography style={BlueButtonText}>Add new event</Typography>
              </Button>
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
              style={{ ...TextFontSize30LineHeight38, textAlign: "left" }}
            >
              Scheduled events
            </Typography>
            <Typography
              style={{ ...TextFontSize20LineHeight30, textAlign: "left" }}
            >
              Here are all the upcoming and active events.
            </Typography>
          </Grid>
        </Grid>
        <Grid marginY={3} container spacing={1}>
          {dataToBeRenderedInUpcomingSection()?.length > 0 ? (
            dataToBeRenderedInUpcomingSection()?.map((event) => {
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
                  style={{ ...TextFontSize30LineHeight38, textAlign: "left" }}
                >
                  Past events
                </Typography>
                <Typography
                  style={{ ...TextFontSize20LineHeight30, textAlign: "left" }}
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
              <Grid style={CenteringGrid} item xs={12} sm={12} md={12} lg={12}>
                <PastEventsTable
                  events={renderingDataBasedOnStaffAndActiveEvent()}
                />
              </Grid>
            </Grid>
          </>
        )}{" "}
      </Grid>
    );
  }
};

export default MainPage;
