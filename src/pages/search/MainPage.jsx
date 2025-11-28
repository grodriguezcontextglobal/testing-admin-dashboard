import { Grid } from "@mui/material";
import { useEffect, useId, useState } from "react";
import { useLocation } from "react-router-dom";
import HeaderSearch from "./components/HeaderSearch";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../api/devitrakApi";
import SearchConsumerRef from "./components/SearchConsumerRef";
import SearchDeviceRef from "./components/SearchDeviceRef";
import SearchEventsRef from "./components/SearchEventsRef";
import SearchStaffRef from "./components/SearchStaffRef";
import SearchTransaction from "./components/SearchTransaction";

const SearchMainPage = () => {
  const [filterOptions, setFilterOptions] = useState({
    "View All": 1,
    Consumers: 0,
    Staff: 0,
    Devices: 0,
    Events: 0,
  }); //'Posts': 0,
  const [searchParams, setSearchParams] = useState("");
  const location = useLocation();
  const { user } = useSelector((state) => state.admin);
  const generalSearch = useQuery({
    queryKey: ["generalSearch", searchParams],
    queryFn: () =>
      devitrakApi.get(
        `/search/searching_?variable=${searchParams}&company=${user.companyData.id}`
      ),
    refetchOnWindowFocus: false,
  });
console.log(generalSearch?.data?.data);
  const styleSection = {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    borderBottom: "solid 1px gray",
    borderRadius: "0",
    padding: "24px 0 24px 12px",
    width: "100%",
    margin: "0.5rem 0",
  };
  useEffect(() => {
    return setSearchParams(location.search.slice(8).replaceAll("%20", " "));
  }, [location.key, location.search, searchParams]);

  const searching_consumer = useId();
  const searching_staff = useId();
  const searching_device = useId();
  const searching_events = useId();
  const searching_transaction = useId();
  // Counts to control visibility based on actual results
  const consumersCount =
    generalSearch?.data?.data?.consumer?.consumers?.length ?? 0;
  const staffCount = generalSearch?.data?.data?.staff?.length ?? 0;
  const devicesCount =
    generalSearch?.data?.data?.devicePool?.devicePool?.length ?? 0;
  const eventsCount = generalSearch?.data?.data?.event?.results?.length ?? 0;
  const sum = () => {
    return consumersCount + staffCount + devicesCount + eventsCount;
  };
  return (
    <Grid
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      container
      id={location.key}
      key={`${location.key} - ${searchParams}`}
    >
      <HeaderSearch
        countingResults={sum}
        filterOptions={filterOptions}
        setFilterOptions={setFilterOptions}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
        }}
      >
        {(filterOptions["View All"] === 1 || filterOptions.Consumers === 1) &&
          consumersCount > 0 && (
          <section style={styleSection}>
            <SearchConsumerRef
              id={searching_consumer}
              searchParams={searchParams}
              data={generalSearch?.data?.data?.consumer}
            />
          </section>
        )}
        {(filterOptions["View All"] === 1 || filterOptions.Staff === 1) &&
          staffCount > 0 && (
          <section style={styleSection}>
            <SearchStaffRef
              id={searching_staff}
              searchParams={searchParams}
              data={generalSearch?.data?.data?.staff}
            />
          </section>
        )}
        {(filterOptions["View All"] === 1 || filterOptions.Devices === 1) &&
          devicesCount > 0 && (
          <section style={{ ...styleSection, display: Array.isArray(generalSearch.data.data.devicePool.devicePool) && generalSearch.data.data.devicePool.devicePool.some((item) => item.activity) ? "flex" : "none" }}>
            <SearchDeviceRef
              id={searching_device}
              searchParams={searchParams}
              data={{
                pool: generalSearch?.data?.data?.devicePool?.devicePool,
                device: generalSearch?.data?.data?.deviceTransaction,
              }}
            />
          </section>
        )}
        {(filterOptions["View All"] === 1 || filterOptions.Events === 1) &&
          eventsCount > 0 && (
          <section style={styleSection}>
            <SearchEventsRef
              id={searching_events}
              searchParams={searchParams}
              data={generalSearch?.data?.data?.event}
            />
          </section>
        )}
        {filterOptions["View All"] === 1 && (
          <section style={{ ...styleSection, display: "none" }}>
            <SearchTransaction
              id={searching_transaction}
              searchParams={searchParams}
            />
          </section>
        )}
      </div>
    </Grid>
  );
};

export default SearchMainPage;
{
  /* <div
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
  }}
>
  {(filterOptions["View All"] === 1 || filterOptions.Consumers === 1) && (
    <section style={styleSection}>
      <SearchConsumer
        id={searching_consumer}
        searchParams={searchParams}
        countingResult={countingResult}
        setCountingResult={setCountingResult}
        countingResults={countingResult}
      />
    </section>
  )}
  {(filterOptions["View All"] === 1 || filterOptions.Staff === 1) && (
    <section style={styleSection}>
      <SearchStaff
        id={searching_staff}
        searchParams={searchParams}
        countingResult={countingResult}
        setCountingResult={setCountingResult}
        countingResults={countingResult}
      />
    </section>
  )}
  {(filterOptions["View All"] === 1 || filterOptions.Devices === 1) && (
    <section style={styleSection}>
      <SearchDevice
        id={searching_device}
        searchParams={searchParams}
        countingResult={countingResult}
        setCountingResult={setCountingResult}
        countingResults={countingResult}
      />
    </section>
  )}
  {(filterOptions["View All"] === 1 || filterOptions.Posts === 1) && (
    <section style={styleSection}>
      <SearchPosts
        id={searching_device}
        searchParams={searchParams}
        countingResult={countingResult}
        setCountingResult={setCountingResult}
      />
    </section>
  )}
  {(filterOptions["View All"] === 1 || filterOptions.Events === 1) && (
    <section style={styleSection}>
      <SearchEvents
        id={searching_events}
        searchParams={searchParams}
        countingResult={countingResult}
        setCountingResult={setCountingResult}
        countingResults={countingResult}
      />
    </section>
  )}
  {filterOptions["View All"] === 1 && (
    <section style={styleSection}>
      <SearchTransaction
        id={searching_transaction}
        searchParams={searchParams}
      />
    </section>
  )}
</div>; */
}
