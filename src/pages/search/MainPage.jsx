import { Grid } from "@mui/material";
import { useEffect, useId, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import HeaderSearch from "./components/HeaderSearch";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../api/devitrakApi";
import { getIndustryProfile } from "../../config/industryProfiles";
import EmptyState from "../../components/UX/emptyState/EmptyState";
import ErrorBoundary from "../../components/utils/ErrorBoundary";
import SearchConsumerRef from "./components/SearchConsumerRef";
import SearchDeviceRef from "./components/SearchDeviceRef";
import SearchEventsRef from "./components/SearchEventsRef";
import SearchInventoryRef from "./components/SearchInventoryRef";
import SearchMembersRef from "./components/SearchMembersRef";
import SearchStaffRef from "./components/SearchStaffRef";
import SearchTransaction from "./components/SearchTransaction";
import { resolveSearchCategoryParam } from "./utils/searchCategoryUtils";

const SearchMainPage = () => {
  const [filterOptions, setFilterOptions] = useState({
    "View All": 1,
    Consumers: 0,
    Staff: 0,
    Inventory: 0,
    Members: 0,
    Devices: 0,
    Events: 0,
  }); //'Posts': 0,
  const [searchParams, setSearchParams] = useState("");
  const location = useLocation();
  const { user } = useSelector((state) => state.admin);
  // inventory and members live in MySQL, which is keyed by the SQL company id —
  // the Mongo company id alone can't reach them.
  const companySqlId = user?.sqlInfo?.company_id;
  const industryProfile = getIndustryProfile(user?.companyData?.industry);
  // "Students" in a district, "Patients" in healthcare; null means this industry
  // has no members module, so the section stays out of search entirely.
  const membersAudience = industryProfile.audience;
  // a school district hides the generic consumer track (students *are* the
  // consumers) — search results follow the same rule as the nav
  const showConsumers = !industryProfile.hiddenNavTabs.includes("consumers");
  // "Devices" means "units in someone's hands". Where that happens through
  // member leases rather than event checkouts, say so: "Assigned".
  const devicesLabel = membersAudience ? "Assigned" : "Devices";
  // Only scope the backend query when exactly one filter tab is active —
  // "View All" and multi-select both mean "don't segment" (see
  // resolveSearchCategoryParam).
  const categoryParam = resolveSearchCategoryParam(filterOptions);
  const filterTabs = useMemo(
    () =>
      [
        { key: "View All", label: "View All" },
        showConsumers ? { key: "Consumers", label: "Consumers" } : null,
        { key: "Staff", label: "Staff" },
        { key: "Inventory", label: "Inventory" },
        membersAudience
          ? { key: "Members", label: membersAudience }
          : null,
        { key: "Devices", label: devicesLabel },
        { key: "Events", label: "Events" },
      ].filter(Boolean),
    [showConsumers, membersAudience, devicesLabel]
  );
  const generalSearch = useQuery({
    queryKey: ["generalSearch", searchParams, categoryParam, companySqlId],
    queryFn: () =>
      devitrakApi.get(
        `/search/searching_?variable=${encodeURIComponent(
          searchParams
        )}&company=${user.companyData.id}&company_sql_id=${companySqlId ?? ""}${
          categoryParam ? `&category=${categoryParam}` : ""
        }`
      ),
    enabled: !!searchParams && !!user?.companyData?.id,
    refetchOnWindowFocus: false,
  });
  const styleSection = {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    borderBottom: "1px solid var(--gray-200, #EAECF0)",
    padding: "32px 0",
    width: "100%",
  };
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchParams(params.get("search") ?? "");
  }, [location.key, location.search]);

  const searching_consumer = useId();
  const searching_staff = useId();
  const searching_device = useId();
  const searching_events = useId();
  const searching_inventory = useId();
  const searching_members = useId();
  const searching_transaction = useId();
  // Counts to control visibility based on actual results
  const consumersCount = showConsumers
    ? generalSearch?.data?.data?.consumer?.consumers?.length ?? 0
    : 0;
  const staffCount = generalSearch?.data?.data?.staff?.length ?? 0;
  const deviceTransaction = generalSearch?.data?.data?.deviceTransaction ?? null;
  const deviceTransactions = deviceTransaction?.deviceTransaction ?? [];
  // the card list is a capped page; `total` is the real match count
  const checkoutsTotal = Number(
    deviceTransaction?.total ?? deviceTransactions.length
  );
  // the Devices bucket spans both ways a unit leaves the shelf: event checkouts
  // (Mongo receivers) and open member/student leases (MySQL)
  const assignments = generalSearch?.data?.data?.memberAssignment ?? null;
  const assignmentsCount = Number(assignments?.total ?? 0);
  const devicesCount = checkoutsTotal + assignmentsCount;
  const eventsCount = generalSearch?.data?.data?.event?.results?.length ?? 0;
  const inventory = generalSearch?.data?.data?.inventory ?? null;
  // `total` is the full row count; `items` is the capped page the API returned
  const inventoryCount = Number(inventory?.total ?? 0);
  const members = membersAudience
    ? generalSearch?.data?.data?.member ?? null
    : null;
  const membersCount = Number(members?.total ?? 0);
  // The API de-duplicates the header total: one physical unit counts once even
  // though it surfaces in both the Inventory and Assigned buckets. The per-bucket
  // counts below stay per-lens on purpose — "1074 units on the books, 910 of them
  // in someone's hands" is the useful reading inside each section.
  const totals = generalSearch?.data?.data?.totals ?? null;
  const sum = () => {
    if (totals?.all != null) {
      let all = Number(totals.all);
      // don't count buckets this industry doesn't show
      if (!showConsumers) all -= Number(totals.consumers ?? 0);
      if (!membersAudience) all -= Number(totals.members ?? 0);
      return Math.max(0, all);
    }
    return (
      consumersCount +
      staffCount +
      devicesCount +
      eventsCount +
      inventoryCount +
      membersCount
    );
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
        setFilterOptions={setFilterOptions}
        initialFilters={location.state?.filter ? [location.state.filter] : []}
        options={filterTabs}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
        }}
      >
        {showConsumers &&
          (filterOptions["View All"] === 1 || filterOptions.Consumers === 1) &&
          consumersCount > 0 && (
          <section style={styleSection}>
            <ErrorBoundary title="Consumers" compact resetKey={searchParams}>
              <SearchConsumerRef
                id={searching_consumer}
                searchParams={searchParams}
                data={generalSearch?.data?.data?.consumer}
              />
            </ErrorBoundary>
          </section>
        )}
        {(filterOptions["View All"] === 1 || filterOptions.Staff === 1) &&
          staffCount > 0 && (
          <section style={styleSection}>
            <ErrorBoundary title="Staff" compact resetKey={searchParams}>
              <SearchStaffRef
                id={searching_staff}
                searchParams={searchParams}
                data={generalSearch?.data?.data?.staff}
              />
            </ErrorBoundary>
          </section>
        )}
        {(filterOptions["View All"] === 1 || filterOptions.Inventory === 1) &&
          inventoryCount > 0 && (
          <section style={styleSection}>
            <ErrorBoundary title="Inventory" compact resetKey={searchParams}>
              <SearchInventoryRef
                id={searching_inventory}
                searchParams={searchParams}
                data={inventory}
                elsewhereLabel={devicesLabel}
              />
            </ErrorBoundary>
          </section>
        )}
        {membersAudience &&
          (filterOptions["View All"] === 1 || filterOptions.Members === 1) &&
          membersCount > 0 && (
          <section style={styleSection}>
            <ErrorBoundary
              title={membersAudience}
              compact
              resetKey={searchParams}
            >
              <SearchMembersRef
                id={searching_members}
                searchParams={searchParams}
                data={members}
                label={membersAudience}
              />
            </ErrorBoundary>
          </section>
        )}
        {(filterOptions["View All"] === 1 || filterOptions.Devices === 1) &&
          devicesCount > 0 && (
          <section style={styleSection}>
            <ErrorBoundary title={devicesLabel} compact resetKey={searchParams}>
              <SearchDeviceRef
                id={searching_device}
                searchParams={searchParams}
                data={{
                  pool: generalSearch?.data?.data?.devicePool?.devicePool ?? [],
                  device: deviceTransactions,
                }}
                assignments={assignments}
                title={devicesLabel}
                audience={membersAudience}
                checkoutsTotal={checkoutsTotal}
                checkoutsHasMore={Boolean(deviceTransaction?.hasMore)}
              />
            </ErrorBoundary>
          </section>
        )}
        {(filterOptions["View All"] === 1 || filterOptions.Events === 1) &&
          eventsCount > 0 && (
          <section style={styleSection}>
            <ErrorBoundary title="Events" compact resetKey={searchParams}>
              <SearchEventsRef
                id={searching_events}
                searchParams={searchParams}
                data={generalSearch?.data?.data?.event}
              />
            </ErrorBoundary>
          </section>
        )}
        {/* Empty messaging: explicitly-selected filters with no hits */}
        {!generalSearch.isLoading &&
          [
            showConsumers
              ? { key: "Consumers", count: consumersCount, icon: "tabler:users" }
              : null,
            { key: "Staff", count: staffCount, icon: "tabler:id-badge-2" },
            { key: "Inventory", count: inventoryCount, icon: "tabler:box" },
            membersAudience
              ? {
                  key: "Members",
                  label: membersAudience,
                  count: membersCount,
                  icon: industryProfile.icon,
                }
              : null,
            {
              key: "Devices",
              label: devicesLabel,
              count: devicesCount,
              icon: "tabler:device-mobile",
            },
            { key: "Events", count: eventsCount, icon: "tabler:calendar-event" },
          ]
            .filter(Boolean)
            .filter((f) => filterOptions[f.key] === 1 && f.count === 0)
            .map((f) => (
              <section style={styleSection} key={`empty-${f.key}`}>
                <EmptyState
                  compact
                  icon={f.icon}
                  title={`No ${(f.label ?? f.key).toLowerCase()} match “${searchParams}”`}
                  description="Try a different keyword, or switch to another filter."
                />
              </section>
            ))}
        {!generalSearch.isLoading &&
          filterOptions["View All"] === 1 &&
          sum() === 0 && (
            <section style={{ ...styleSection, borderBottom: "none" }}>
              <EmptyState
                icon="tabler:search-off"
                title={`No results for “${searchParams}”`}
                description={`Nothing matched across ${filterTabs
                  .filter((tab) => tab.key !== "View All")
                  .map((tab) => tab.label.toLowerCase())
                  .join(", ")}. Check the spelling or try a broader keyword.`}
              />
            </section>
          )}
        {filterOptions["View All"] === 1 && (
          <section style={{ ...styleSection, display: "none" }}>
            {/* hidden, but it still mounts — an unguarded throw here would blank
                the page just as visibly as a rendered section */}
            <ErrorBoundary title="Transactions" compact resetKey={searchParams}>
              <SearchTransaction
                id={searching_transaction}
                searchParams={searchParams}
              />
            </ErrorBoundary>
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
