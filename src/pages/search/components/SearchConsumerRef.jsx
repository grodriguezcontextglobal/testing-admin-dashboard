import { Grid } from "@mui/material";
import { Pagination } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { onAddCustomerInfo } from "../../../store/slices/customerSlice";
import { onAddCustomer } from "../../../store/slices/stripeSlice";
import CardSearchConsumersFound from "../utils/CardSearchConsumerFound";
import NoDataFound from "../utils/NoDataFound";

const PAGE_SIZE = 10;
const SearchConsumerRef = ({ data }) => {
  const { eventsPerAdmin } = useSelector((state) => state.event);
  const [consumersData, setConsumersData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const allAllow = useMemo(() => {
    const active = eventsPerAdmin.active ?? [];
    const completed = eventsPerAdmin.completed ?? [];
    return [...active, ...completed];
  }, [eventsPerAdmin.active, eventsPerAdmin.completed]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sortingDataBasedOnStaffCredentials = useCallback((props) => {
    if (allAllow.length === 0) {
      return setConsumersData(props);
    }
    const result = new Set();
    const eventIdListStaffCredentials = [...allAllow.map((event) => event.id)];
    props?.consumers.forEach((item) => {
      const eventIdList = [...item.event_providers.map((event) => event)];
      if (
        eventIdList.some((eventId) =>
          eventIdListStaffCredentials.includes(eventId)
        )
      ) {
        result.add(item);
      }
    });
    return setConsumersData({ ...props, consumers: Array.from(result) });
  }, [allAllow]);
  useEffect(() => {
    const controller = new AbortController();
    if (data?.consumers?.length > 0) {
      sortingDataBasedOnStaffCredentials(data);
    }
    setCurrentPage(1);
    return () => controller.abort();
  }, [data, sortingDataBasedOnStaffCredentials]);

  const allConsumers = consumersData?.consumers ?? [];
  const pageConsumers = allConsumers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleConsumerInfo = (props) => {
    let userFormatData = {
      uid: props?.id,
      name: props?.name,
      lastName: props?.lastName,
      email: props?.email,
      phoneNumber: props?.phoneNumber,
      data: props,
    };
    dispatch(onAddCustomerInfo(userFormatData));
    dispatch(onAddCustomer(userFormatData));
    navigate(`/consumers/${userFormatData.uid}`);
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
          Consumers
        </p>
        <p style={{ fontFamily: "Inter", fontSize: "14px", fontWeight: 400, lineHeight: "20px", color: "var(--gray-600, #475467)", margin: 0 }}>
          All consumers matching your search.
        </p>
      </Grid>

      <Grid item xs={12} sm={12} md={8} lg={8}>
        <Grid style={{ display: "flex", justifyContent: "flex-end" }} container gap={1}>
          {pageConsumers.length > 0 ? (
            pageConsumers.map((item) => (
              <Grid key={item.id} item xs={12} sm={12} md={3} lg={3}>
                <CardSearchConsumersFound props={item} fn={handleConsumerInfo} />
              </Grid>
            ))
          ) : (
            <NoDataFound />
          )}
        </Grid>
        {allConsumers.length > PAGE_SIZE && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={allConsumers.length}
              onChange={setCurrentPage}
              showSizeChanger={false}
              showTotal={(total, range) => `${range[0]}–${range[1]} of ${total}`}
            />
          </div>
        )}
      </Grid>
    </Grid>
  );
  // }
};

export default SearchConsumerRef;
