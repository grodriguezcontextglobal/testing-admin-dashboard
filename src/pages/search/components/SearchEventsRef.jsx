import { Grid } from "@mui/material";
import { Pagination } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 10;
import { devitrakApi } from "../../../api/devitrakApi";
import {
  onAddEventData,
  onAddQRCodeLink,
  onSelectCompany,
  onSelectEvent,
} from "../../../store/slices/eventSlice";
import { onAddSubscription } from "../../../store/slices/subscriptionSlice";
import CardEventsFound from "../utils/CardEventsFound";
import NoDataFound from "../utils/NoDataFound";
const SearchEventsRef = ({ data }) => {
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const allEvents = data?.results ?? [];
  const pageEvents = allEvents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
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
        style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", alignSelf: "flex-start", gap: "4px" }}
        item
        xs={12}
        sm={12}
        md={4}
        lg={4}
      >
        <p style={{ fontFamily: "Inter", fontSize: "18px", fontWeight: 600, lineHeight: "28px", color: "var(--gray-900, #101828)", margin: 0 }}>
          Events
        </p>
        <p style={{ fontFamily: "Inter", fontSize: "14px", fontWeight: 400, lineHeight: "20px", color: "var(--gray-600, #475467)", margin: 0 }}>
          All events matching your search.
        </p>
      </Grid>

      <Grid item xs={12} sm={12} md={8} lg={8}>
        <Grid
          style={{ display: "flex", justifyContent: "flex-end" }}
          container
          gap={1}
        >
          {pageEvents.length > 0 ? (
            pageEvents.map((item) => (
              <Grid key={item.id} item xs={12} sm={12} md={3} lg={3}>
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
        {allEvents.length > PAGE_SIZE && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={allEvents.length}
              onChange={setCurrentPage}
              showSizeChanger={false}
              showTotal={(total, range) => `${range[0]}–${range[1]} of ${total}`}
            />
          </div>
        )}
      </Grid>
    </Grid>
  );
};
export default SearchEventsRef;
