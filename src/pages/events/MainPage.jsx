import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { groupBy } from "lodash";
import { lazy, Suspense, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import Loading from "../../components/animation/Loading";
import { WhiteCirclePlusIcon } from "../../components/icons/WhiteCirclePlusIcon";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import { onAddCompanyAccountStripe } from "../../store/slices/adminSlice";
import {
  onAddContactInfo,
  onAddDeviceSetup,
  onAddEventInfoDetail,
  onAddEventStaff,
  onAddListEventPermitPerAdmin,
} from "../../store/slices/eventSlice";
import CenteringGrid from "../../styles/global/CenteringGrid";
import { TextFontSize20LineHeight30 } from "../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../styles/global/TextFontSize30LineHeight38";
const CardEventDisplay = lazy(() => import("./components/CardEventDisplay"));
const PastEventsTable = lazy(() => import("./components/PastEventsTable"));
const BannerMsg = lazy(() => import("./utils/BannerMsg"));
const BannerNoEventStaffOnly = lazy(() =>
  import("../../components/utils/BannerNoEventStaffOnly")
);
const MainPage = () => {
  const { watch } = useForm();
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const eventQuery = useQuery({
    queryKey: ["events"],
    queryFn: () =>
      devitrakApi.get(
        `/event/event-list-per-company?company=${user.company}&type=event`
      ),
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
      const groupByActive = groupBy(companyData, "active");
      const filterEventsByEmail = (events, key = null) => {
        if (
          user.companyData.employees.filter(
            (employee) => employee.user === user.email
          )[0].role < 1
        ) {
          return events ?? [];
        }
        if (key) {
          return events?.filter((event) => {
            event?.staff[key]?.some((member) => member.email === user.email);
          });
        }
        return events?.filter((event) => {
          let adminUser = event.staff.adminUser;
          let headsetAttendees = event.staff.headsetAttendees ?? [];
          let staff = [...adminUser, ...headsetAttendees];
          return staff.some((member) => member.email === user.email);
        });
      };
      const active = groupByActive.true ?? [];
      const inactive = groupByActive.false ?? [];
      const activeAdminEvents = filterEventsByEmail([...active, ...inactive]);
      const activeEvents = [...activeAdminEvents];
      const inactiveAdminEvents = filterEventsByEmail(
        groupByActive.false,
        "adminUser"
      );

      dispatch(
        onAddListEventPermitPerAdmin({
          active: activeEvents,
          completed: inactiveAdminEvents ?? [],
        })
      );
      const inactiveEvents = inactiveAdminEvents ?? [];
      const combinedEvents = [...activeEvents, ...inactiveEvents];
      return combinedEvents;
    };
    renderingDataBasedOnStaffAndActiveEvent();

    const checkActiveEventsToRemoveDuplicates = () => {
      const events = new Map();
      const data = renderingDataBasedOnStaffAndActiveEvent() ?? [];
      for (let event of data) {
        if (!events.has(event.id)) {
          events.set(event.id, event);
        }
      }
      return Array.from(events.values());
    };
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
                  icon={<WhiteCirclePlusIcon />}
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
                  icon={<WhiteCirclePlusIcon />}
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
};

export default MainPage;
