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
import SearchSection from "./SearchSection";
import {
  cardGrid,
  sectionFooter,
} from "../utils/sectionLayout";
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
    <SearchSection title="Events" subtitle="All events matching your search.">
      {pageEvents.length > 0 ? (
        <div style={cardGrid(280)}>
          {pageEvents.map((item) => (
            <CardEventsFound
              key={item.id}
              props={{
                eventName: item.eventInfoDetail.eventName,
                address: item.eventInfoDetail.address,
                data: item,
              }}
              fn={handleStoreData}
            />
          ))}
        </div>
      ) : (
        <NoDataFound />
      )}
      {allEvents.length > PAGE_SIZE && (
        <div style={sectionFooter}>
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
    </SearchSection>
  );
};
export default SearchEventsRef;
