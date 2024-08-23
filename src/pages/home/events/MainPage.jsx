import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import _ from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import { onAddListEventPermitPerAdmin } from "../../../store/slices/eventSlice";
import CardEventDisplay from "../../events/components/CardEventDisplay";
import BannerMsg from "../../events/utils/BannerMsg";
import { useEffect } from "react";
const MainPage = () => {
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();

  const eventQuery = useQuery({
    queryKey: ["events"],
    queryFn: () =>
      devitrakApi.post("/event/event-list", {
        company: user.companyData.company_name,
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
      let checking = [];
      if (dataPerCompany()?.length > 0) {
        const group_by_active = _.groupBy(dataPerCompany(), "active");
        if (group_by_active[true]) {
          const activeAndAdminMember = group_by_active.true?.filter(
            (adminMember) =>
              adminMember.staff?.adminUser?.find(
                (member) => member.email === user.email
              )
          );
          if (activeAndAdminMember) {
            checking = [...checking, ...activeAndAdminMember];
          } else {
            checking = [...checking];
          }

          const activeAndHeadsetAttendeesMember = group_by_active.true?.filter(
            (adminMember) =>
              adminMember.staff.headsetAttendees?.find(
                (member) => member.email === user?.email
              )
          );
          if (activeAndHeadsetAttendeesMember) {
            checking = [...checking, ...activeAndHeadsetAttendeesMember];
          } else {
            checking = [...checking];
          }
        }
        const activeEventAndMembers = [...checking];

        if (group_by_active[false]) {
          const inactiveButAdmin = group_by_active.false?.filter(
            (adminMember) =>
              adminMember.staff.adminUser?.find(
                (member) => member.email === user.email
              )
          );

          dispatch(
            onAddListEventPermitPerAdmin({
              active: activeEventAndMembers,
              completed: inactiveButAdmin,
            })
          );
        }
        return activeEventAndMembers;
      }
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
      <Grid container>
        {dataToBeRenderedInUpcomingSection()?.length > 0 ? (
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
    );
  }
};

export default MainPage;
