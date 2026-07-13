import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import Loading from "../../components/animation/Loading";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import EventsCarousel from "../../components/UX/carousel/EventsCarousel";
import { onAddCompanyAccountStripe } from "../../store/slices/adminSlice";
import {
  onResetEventInfo
} from "../../store/slices/eventSlice";
import CenteringGrid from "../../styles/global/CenteringGrid";
import { Subtitle } from "../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../styles/global/TextFontSize30LineHeight38";
import { useEventHook } from "./hook/useEventHook";
import PageSpinner from "../../components/utils/PageSpinner";
const CardEventDisplay = lazy(() => import("./components/CardEventDisplay"));
const PastEventsTable = lazy(() => import("./components/PastEventsTable"));
const BannerMsg = lazy(() => import("./utils/BannerMsg"));
const BannerNoEventStaffOnly = lazy(() =>
  import("../../components/utils/BannerNoEventStaffOnly")
);
const MainPage = () => {
  const [searchEvent, setSearchEvent] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  // eventList derives from the query cache (not local state): revisits render
  // the cached list instantly while the refetch runs in the background —
  // gating the page on isRefetching swapped content back to a spinner on
  // every navigation, which read as a flicker mid page-transition.
  const { isLoading, data: eventsData } = useQuery({
    queryKey: ["events"],
    queryFn: () =>
      devitrakApi.get(
        `/event/event-list-per-company?company=${user.company}&type=event`
      ),
    enabled: !!user.companyData.id,
  });
  const eventList = eventsData?.data?.list ?? [];
  const companyAccountStripeQuery = useQuery({
    queryKey: ["stripe_company_account"],
    queryFn: () =>
      devitrakApi.post(`/stripe/company-account-stripe`, {
        company: user.companyData.company_name,
      }),
    refetchOnMount: false,
  });

  const {
    dataToBeRenderedInLiveSection,
    dataToBeRenderedInUpcomingSection,
    renderingDataBasedOnStaffAndActiveEvent,
    checkActiveEventsToRemoveDuplicates
  } = useEventHook({
    eventList,
    searchValue: searchEvent,
  });
  if (isLoading) {
    return <PageSpinner />;
  }
  const liveEvents = dataToBeRenderedInLiveSection();
  const upcomingEvents = dataToBeRenderedInUpcomingSection();
  // Preserves the redux dispatch side-effect and yields the full ordered list.
  const allRelevantEvents = renderingDataBasedOnStaffAndActiveEvent();
  const pastEventsCount = allRelevantEvents.length - liveEvents.length - upcomingEvents.length;
  const showLive = statusFilter === "all" || statusFilter === "live";
  const showUpcoming = statusFilter === "all" || statusFilter === "upcoming";
  const showPast = statusFilter === "all" || statusFilter === "past";
  const noActiveEvents = liveEvents.length === 0 && upcomingEvents.length === 0;

  const statusFilters = [
    { key: "all", label: "All" },
    { key: "live", label: "Live" },
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
  ];
  const pillStyle = {
  border: "none",
  background: "transparent",
  borderRadius: "var(--radius-sm, 6px)",
  padding: "8px 12px",
  fontSize: "14px",
  lineHeight: "20px",
  color: "var(--gray-500, #777b73)",
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  transition: "background 0.12s ease, color 0.12s ease, box-shadow 0.12s ease",
};
  const pillActiveStyle = {
  background: "var(--base-white, #fff)",
  color: "var(--gray-700, #484d47)",
  boxShadow: "var(--shadow-sm)",
};
  const sectionHeaderStyle = {
    ...TextFontSize20LineHeight30,
    textAlign: "left",
    width: "100%",
    fontWeight: 600,
    color: "#344054",
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
          marginY={2}
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          flexWrap={"wrap"}
          gap={1}
          container
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "2px",
              border: "1px solid var(--gray-200, #ddded6)",
              borderRadius: "var(--radius-md, 8px)",
              padding: "4px",
              backgroundColor: "var(--gray-50, #f7f7f4)",
              width: "fit-content",
            }}
          >
            {statusFilters.map((filter) => (
              <button
                key={`event-status-${filter.key}`}
                onClick={() => setStatusFilter(filter.key)}
                style={{
                  ...pillStyle,
                  ...(statusFilter === filter.key ? pillActiveStyle : {}),
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={searchEvent}
            onChange={(e) => setSearchEvent(e.target.value)}
            placeholder="Search events"
            style={{
              flex: "1 1 200px",
              maxWidth: "280px",
              height: "40px",
              padding: "0 14px",
              border: "1px solid #D0D5DD",
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: "Inter",
              color: "#344054",
              outline: "none",
            }}
          />
        </Grid>

        {showLive && liveEvents.length > 0 && (
          <>
            <Grid marginY={2} container>
              <Grid item xs={12}>
                <Typography style={sectionHeaderStyle}>Live now</Typography>
                <Typography
                  style={{ ...Subtitle, textAlign: "left", width: "100%" }}
                >
                  Events happening right now.
                </Typography>
              </Grid>
            </Grid>
            <Grid marginY={1} container>
              <Grid item xs={12}>
                <EventsCarousel
                  items={liveEvents}
                  renderItem={(event) => <CardEventDisplay props={event} />}
                />
              </Grid>
            </Grid>
          </>
        )}

        {showUpcoming && (
          <>
            <Grid marginY={2} container>
              <Grid item xs={12}>
                <Typography style={sectionHeaderStyle}>Upcoming</Typography>
                <Typography
                  style={{ ...Subtitle, textAlign: "left", width: "100%" }}
                >
                  Scheduled events that have not started yet.
                </Typography>
              </Grid>
            </Grid>
            <Grid marginY={1} container>
              {upcomingEvents.length > 0 ? (
                <Grid item xs={12}>
                  <EventsCarousel
                    items={upcomingEvents}
                    renderItem={(event) => <CardEventDisplay props={event} />}
                  />
                </Grid>
              ) : noActiveEvents ? (
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
              ) : (
                <Grid item xs={12}>
                  <Typography
                    style={{ ...Subtitle, textAlign: "left", width: "100%" }}
                  >
                    No upcoming events.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </>
        )}

        {showPast && pastEventsCount > 0 && (
          <>
            <Grid marginY={2} container>
              <Grid item xs={12}>
                <Typography style={sectionHeaderStyle}>Past events</Typography>
                <Typography
                  style={{ ...Subtitle, textAlign: "left", width: "100%" }}
                >
                  Here are all the past events that have now concluded.
                </Typography>
              </Grid>
            </Grid>
            <Grid marginY={1} display={"flex"} container>
              <Grid style={CenteringGrid} item xs={12} sm={12} md={12} lg={12}>
                <PastEventsTable
                  events={checkActiveEventsToRemoveDuplicates().reverse()}
                />
              </Grid>
            </Grid>
          </>
        )}

        {((statusFilter === "live" && liveEvents.length === 0) ||
          (statusFilter === "past" && pastEventsCount === 0)) && (
          <Grid marginY={3} container>
            <Grid item xs={12}>
              <Typography
                style={{ ...Subtitle, textAlign: "left", width: "100%" }}
              >
                {statusFilter === "live"
                  ? "No events are live right now."
                  : "No past events yet."}
              </Typography>
            </Grid>
          </Grid>
        )}
      </Grid>
    </Suspense>
  );
}
// };

export default MainPage;
