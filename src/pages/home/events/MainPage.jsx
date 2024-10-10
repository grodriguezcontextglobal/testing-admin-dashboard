import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { groupBy } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import { onAddListEventPermitPerAdmin } from "../../../store/slices/eventSlice";
// import CardEventDisplay from "../../events/components/CardEventDisplay";
// import BannerMsg from "../../events/utils/BannerMsg";
import { lazy, Suspense, useEffect } from "react";
import Loading from "../../../components/animation/Loading";
import CenteringGrid from "../../../styles/global/CenteringGrid";
const CardEventDisplay = lazy(() => import("../../events/components/CardEventDisplay"));
const BannerMsg = lazy(() => import("../../events/utils/BannerMsg"));
const MainPage = () => {
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();

  const eventQuery = useQuery({
    queryKey: ["events"],
    queryFn: () =>
      devitrakApi.post("/event/event-list", {
        company: user.companyData.company_name,
        type:'event'
      }),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    eventQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  const dataPerCompany = () => {
    const groupOfCompanies = eventQuery?.data?.data?.list;
    if (groupOfCompanies) return groupOfCompanies;
    return undefined;
  };
  useEffect(() => {
    const controller = new AbortController();
    dataPerCompany();
    return () => {
      controller.abort();
    };
  }, [eventQuery.data]);

  if (eventQuery.data) {
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
      const activeAdminEvents = filterEventsByEmail([
        ...active,
      ]);
      const activeEvents = [...activeAdminEvents];
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
      return activeEvents;
    };
    renderingDataBasedOnStaffAndActiveEvent();

    const dataToBeRenderedInUpcomingSection = () => {
      const result = new Set();
      if (renderingDataBasedOnStaffAndActiveEvent()?.length > 0) {
        for (let data of renderingDataBasedOnStaffAndActiveEvent()) {
          const currentDate = new Date();
          const begin = new Date(`${data.eventInfoDetail.dateBegin}`);
          let ending = new Date(`${data.eventInfoDetail.dateEnd}`);
          if (
            currentDate < begin ||
            (currentDate >= begin && currentDate <= ending)
          ) {
            result.add({ key: data.id, ...data });
          }
        }
      }
      return Array.from(result);
    };
    return (
      <Suspense
        fallback={
          <div style={CenteringGrid}>
            <Loading />
          </div>
        }
      >
        <Grid container>
          {renderingDataBasedOnStaffAndActiveEvent().length > 0 ? (
            dataToBeRenderedInUpcomingSection()?.map((event) => {
              return (
                <Grid
                  key={event.id}
                  padding={1}
                  alignSelf={"flex-start"}
                  item
                  xs={12}
                  sm={12}
                  md={6}
                  lg={6}
                >
                  <CardEventDisplay props={event} />
                </Grid>
              );
            })
          ) : (
            <BannerMsg />
          )}
        </Grid>
      </Suspense>
    );
  }
};

export default MainPage;
