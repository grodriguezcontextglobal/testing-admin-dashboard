import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import EmptyState from "../../components/UX/emptyState/EmptyState";
import FilterBar from "../../components/UX/filterBar/FilterBar";
import GrayButtonComponent from "../../components/UX/buttons/GrayButton";
import PageHeader from "../../components/UX/pageHeader/PageHeader";
import { ProfileStatTiles } from "../../components/UX/profile";
import BaseTable from "../../components/UX/tables/BaseTable";
import { usePlatformExport } from "../../hooks/platform/usePlatformExport";
import { usePlatformList } from "../../hooks/platform/usePlatformLists";
import CompanyFilter from "./components/CompanyFilter";
import ConsoleNotice from "./components/ConsoleNotice";
import PlatformRequestError from "./components/PlatformRequestError";
import { toTableColumns } from "./components/platformColumns";
import ConsoleSelect from "./components/ConsoleSelect";
import {
  AUDIT_RANGES,
  PLATFORM_LIST_SCREENS,
  buildListQuery,
  screenTotalsTiles,
  withReportedMoney,
} from "./utils/platformScreens";

const PAGE_SIZE = 25;

/**
 * One cross-client list screen (Inventory, Transactions, Events, Members &
 * consumers, Audit log), driven by its config in utils/platformScreens.js:
 * totals, filter tabs, debounced search, server pagination.
 */
const PlatformListPage = ({ screenKey }) => {
  const screen = PLATFORM_LIST_SCREENS[screenKey];
  const [filter, setFilter] = useState(screen.defaultFilter);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("all");
  const [staff, setStaff] = useState("all");
  const [range, setRange] = useState(AUDIT_RANGES[1].value);
  const [page, setPage] = useState(1);
  const { startExport, exporting, contextHolder } = usePlatformExport({
    resource: screen.resource,
    title: screen.title,
  });

  // One request per pause in typing, not one per key.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const query = buildListQuery({
    filterParam: screen.filterParam,
    filter,
    search,
    company,
    staff: screen.staffFilter ? staff : undefined,
    range: screen.dateRange ? range : undefined,
    page,
    limit: PAGE_SIZE,
  });
  const list = usePlatformList(screen.resource, query);

  return (
    <>
      {contextHolder}
      <PageHeader
        title={screen.title}
        supportingText={screen.description}
        divider
        actions={
          <GrayButtonComponent
            size="sm"
            title="Export CSV"
            iconLeading={<Download size={16} aria-hidden="true" />}
            func={() => startExport(query)}
            isLoading={exporting}
            isDisabled={exporting || list.isError}
            ariaLabel={`Export ${screen.title.toLowerCase()} as CSV`}
          />
        }
      />
      {screen.notice && (
        <ConsoleNotice tone="privacy" testId={`platform-notice-${screenKey}`}>
          {screen.notice}
        </ConsoleNotice>
      )}
      {(screen.notes ?? []).map((note, index) => (
        <ConsoleNotice key={note.slice(0, 32)} tone="info" testId={`platform-note-${screenKey}-${index}`}>
          {note}
        </ConsoleNotice>
      ))}
      {!list.isError && <ProfileStatTiles tiles={screenTotalsTiles(screen, list.totals)} />}
      <FilterBar
        tabs={screen.filters}
        activeTab={filter}
        onTabChange={(key) => {
          setFilter(key);
          setPage(1);
        }}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder={screen.searchPlaceholder}
        trailing={
          <>
            {screen.staffFilter && (
              <ConsoleSelect
                label="Staff member"
                testId="platform-staff-filter"
                value={staff}
                disabled={!list.filters?.staff?.length}
                options={[
                  { value: "all", label: "All operators" },
                  ...(list.filters?.staff ?? []),
                ]}
                onChange={(next) => {
                  setStaff(next);
                  setPage(1);
                }}
              />
            )}
            {screen.companyFilter && (
              <CompanyFilter
                value={company}
                onChange={(next) => {
                  setCompany(next);
                  setPage(1);
                }}
              />
            )}
            {screen.dateRange && (
              <ConsoleSelect
                label="Date range"
                testId="platform-range-filter"
                value={range}
                options={AUDIT_RANGES}
                onChange={(next) => {
                  setRange(next);
                  setPage(1);
                }}
              />
            )}
          </>
        }
      />
      {list.isError ? (
        <PlatformRequestError error={list.error} path={`/${screen.resource}`} onRetry={() => list.refetch()} />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <BaseTable
            columns={toTableColumns(withReportedMoney(screen.columns, list.rows))}
            dataSource={list.rows}
            rowKey={(row) => row.id ?? JSON.stringify(row)}
            loading={list.isLoading || list.isFetching}
            loadingLabel={`Loading ${screen.title.toLowerCase()}…`}
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total: list.total,
              position: ["bottomCenter"],
              showSizeChanger: false,
              onChange: setPage,
            }}
            locale={{
              emptyText: (
                <EmptyState compact title="Nothing matches" description="Change the filter or the search." />
              ),
            }}
          />
        </div>
      )}
    </>
  );
};

PlatformListPage.propTypes = {
  screenKey: PropTypes.oneOf(Object.keys(PLATFORM_LIST_SCREENS)).isRequired,
};

export default PlatformListPage;
