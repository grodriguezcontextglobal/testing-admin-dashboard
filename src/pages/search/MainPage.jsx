import { Grid } from "@mui/material";
import { useId, useState } from "react";
import { useLocation } from "react-router-dom";
import HeaderSearch from "./components/HeaderSearch";
import SearchConsumer from "./components/SearchConsumer";
import SearchDevice from "./components/SearchDevice";
import SearchEvents from "./components/SearchEvents";
// import SearchPosts from "./components/SearchPosts";
import SearchStaff from "./components/SearchStaff";
import SearchTransaction from "./components/SearchTransaction";

const SearchMainPage = () => {
  const [countingResult, setCountingResult] = useState([0]);
  const [filterOptions, setFilterOptions] = useState({
    "View All": 1,
    Consumers: 0,
    Staff: 0,
    Devices: 0,
    Events: 0,
  }); //'Posts': 0,
  const location = useLocation();
  const searchParams = location.search.slice(8);
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

  const searching_consumer = useId();
  const searching_staff = useId();
  const searching_device = useId();
  const searching_events = useId();
  const searching_transaction = useId();
  const sumOfResultDisplayed = () => {
    const initialValue = 0;
    const count = countingResult.reduce(
      (accu, curr) => accu + curr,
      initialValue
    );
    return count;
  };
  return (
    <Grid
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      container
    >
      <HeaderSearch
        countingResults={sumOfResultDisplayed()}
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
        {(filterOptions["View All"] === 1 || filterOptions.Consumers === 1) && (
          <section style={styleSection}>
            <SearchConsumer
              id={searching_consumer}
              searchParams={searchParams}
              countingResult={countingResult}
              setCountingResult={setCountingResult}
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
            />
          </section>
        )}
        {/* {(filterOptions["View All"] === 1 || filterOptions.Posts === 1) && <section style={styleSection}>
                    <SearchPosts id={searching_device} searchParams={searchParams} countingResult={countingResult} setCountingResult={setCountingResult} />
                </section>} */}
        {(filterOptions["View All"] === 1 || filterOptions.Events === 1) && (
          <section style={styleSection}>
            <SearchEvents
              id={searching_events}
              searchParams={searchParams}
              countingResult={countingResult}
              setCountingResult={setCountingResult}
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
      </div>
    </Grid>
  );
};

export default SearchMainPage;
