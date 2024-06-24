import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import {
  onAddEventData,
  onAddQRCodeLink,
  onSelectCompany,
  onSelectEvent,
} from "../../../store/slices/eventSlice";
import { onAddSubscription } from "../../../store/slices/subscriptionSlice";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import CardEventsFound from "../utils/CardEventsFound";
import NoDataFound from "../utils/NoDataFound";
const SearchEvents = ({ searchParams }) => {
  const searchValue = String(searchParams).replaceAll("%20", " ");
  const { user } = useSelector((state) => state.admin);
  const staffMembersQuery = useQuery({
    queryKey: ["companyEventList"],
    queryFn: () =>
      devitrakApi.post("/event/event-list", {
        company: user.company,
        active: true,
      }),
    // enabled: false,
    refetchOnMount: false,
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();
  useEffect(() => {
    const controller = new AbortController();
    staffMembersQuery.refetch();
    return () => {
      controller.abort();
    };
  }, [searchParams]);

  const sortAndRenderFoundData = () => {
    if (staffMembersQuery.data) {
      const foundData = staffMembersQuery.data.data.list;
      const result = foundData?.filter((element) =>
        JSON.stringify(element)
          .toLowerCase()
          .includes(`${searchValue}`.toLowerCase())
      );
      return result;
    }
  };
  useEffect(() => {
    const controller = new AbortController();
    sortAndRenderFoundData();
    return () => {
      controller.abort();
    };
  }, [searchParams]);

  const handleStoreData = async (record) => {
    const sqpFetchInfo = await devitrakApi.post(
      "/db_event/events_information",
      {
        zip_address: record.data.eventInfoDetail.address.split(" ").at(-1),
        event_name: record.data.eventInfoDetail.eventName,
      }
    );
    dispatch(onSelectEvent(record.data.eventInfoDetail.eventName));
    dispatch(onSelectCompany(record.data.company));
    dispatch(
      onAddEventData({ ...record.data, sql: sqpFetchInfo.data.events.at(-1) })
    );
    dispatch(onAddSubscription(record.data.subscription));
    dispatch(
      onAddQRCodeLink(
        record.data.qrCodeLink ??
          `https://app.devitrak.net/?event=${encodeURI(
            record.eventInfoDetail.eventName
          )}&company=${encodeURI(record.company)}`
      )
    );
    return navigate("/events/event-quickglance");
  };

  if (staffMembersQuery.isLoading)
    return (
      <div style={CenteringGrid}>
        <Loading />
      </div>
    );
  if (staffMembersQuery.data) {
    return (
      <Grid
        container
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <Grid
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            alignSelf: "flex-start",
          }}
          item
          xs={12}
          sm={12}
          md={4}
          lg={4}
        >
          <Typography
            style={{
              ...TextFontSize30LineHeight38,
              fontSize: "36px",
              lineHeight: "44px",
              fontWeight: 600,
              width: "100%",
              textAlign: "left",
            }}
          >
            Search events{" "}
          </Typography>
          <br />
          <Typography
            style={{
              ...TextFontSize20LineHeight30,
              width: "100%",
              textAlign: "left",
            }}
          >
            All events matching the search keywords.
          </Typography>
        </Grid>

        <Grid item xs={12} sm={12} md={8} lg={8}>
          <Grid container gap={1}>
            {sortAndRenderFoundData()?.length > 0 ? (
              sortAndRenderFoundData()?.map((item) => (
                <Grid key={item.id} item xs={12} sm={12} md={4} lg={4}>
                  {" "}
                  <CardEventsFound
                    props={{
                      eventName: item.eventInfoDetail.eventName,
                      address: item.eventInfoDetail.address,
                      data: item,
                    }}
                    fn={handleStoreData}
                  />
                </Grid>
              ))
            ) : (
              <NoDataFound />
            )}
          </Grid>
        </Grid>
      </Grid>
    );
  }
};
export default SearchEvents;
