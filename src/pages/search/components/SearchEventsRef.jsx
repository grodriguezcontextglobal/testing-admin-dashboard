import { Grid, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import {
  onAddEventData,
  onAddQRCodeLink,
  onSelectCompany,
  onSelectEvent,
} from "../../../store/slices/eventSlice";
import { onAddSubscription } from "../../../store/slices/subscriptionSlice";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import CardEventsFound from "../utils/CardEventsFound";
import NoDataFound from "../utils/NoDataFound";
const SearchEventsRef = ({ data }) => {
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const dispatch = useDispatch();
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
          `https://app.devitrak.net/?event=${record.id}&company=${user.companyData.id}`
      )
    );
    return navigate("/events/event-quickglance");
  };

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
        <Grid
          style={{ display: "flex", justifyContent: "flex-end" }}
          container
          gap={1}
        >
          {data?.results?.length > 0 ? (
            data?.results?.map((item) => (
              <Grid key={item.id} item xs={12} sm={12} md={3} lg={3}>
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
};
export default SearchEventsRef;
