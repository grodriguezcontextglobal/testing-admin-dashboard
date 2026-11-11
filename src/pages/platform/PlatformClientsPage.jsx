import { useEffect, useState } from "react";
import BaseTable from "../../components/UX/tables/BaseTable";
import EmptyState from "../../components/UX/emptyState/EmptyState";
import FilterBar from "../../components/UX/filterBar/FilterBar";
import PageHeader from "../../components/UX/pageHeader/PageHeader";
import PillUIComponent from "../../components/UX/Chip/PillUIComponent";
import { usePlatformCompanies } from "../../hooks/platform/usePlatformCompanies";
import {
  companyStatusPill,
  formatCents,
  formatLastActivity,
} from "./utils/platformClients";

/**
 * Every client company (FRONTEND_admin_console_plan_2026-11-11.md, F7).
 *
 * Row shape expected from GET /api/platform/companies (proposal, plan §4 B3):
 * { id, name, ownerEmail, status, staffCount, deviceCount, devicesOut,
 *   devicesOverdue, revenue30dCents, currency, lastActivityAt }
 */
const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "at_risk", label: "At risk" },
  { key: "trial", label: "Trial" },
  { key: "paused", label: "Paused" },
];

const PAGE_SIZE = 25;

const numberCell = (value) => (
  <span style={{ fontVariantNumeric: "tabular-nums" }}>
    {value !== null && value !== undefined && Number.isFinite(Number(value))
      ? Number(value).toLocaleString("en-US")
      : "—"}
  </span>
);

const columns = [
  {
    title: "Company",
    dataIndex: "name",
    key: "name",
    render: (name, row) => (
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span style={{ fontWeight: 600 }}>{name}</span>
        <span style={{ fontSize: "13px", color: "var(--gray600, #475467)" }}>
          {row.ownerEmail}
        </span>
      </div>
    ),
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status) => {
      const pill = companyStatusPill(status);
      return (
        <PillUIComponent color={pill.color} size="sm">
          {pill.label}
        </PillUIComponent>
      );
    },
  },
  { title: "Staff", dataIndex: "staffCount", key: "staffCount", align: "right", render: numberCell },
  { title: "Devices", dataIndex: "deviceCount", key: "deviceCount", align: "right", render: numberCell },
  { title: "Out now", dataIndex: "devicesOut", key: "devicesOut", align: "right", render: numberCell },
  { title: "Overdue", dataIndex: "devicesOverdue", key: "devicesOverdue", align: "right", render: numberCell },
  {
    title: "Revenue 30d",
    dataIndex: "revenue30dCents",
    key: "revenue30dCents",
    align: "right",
    render: (cents, row) => formatCents(cents, row.currency || "USD"),
  },
  {
    title: "Last activity",
    dataIndex: "lastActivityAt",
    key: "lastActivityAt",
    render: (iso) => formatLastActivity(iso),
  },
];

const PlatformClientsPage = () => {
  const [status, setStatus] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // One request per pause in typing, not one per key.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { rows, total, isLoading, isFetching, isError, error } = usePlatformCompanies({
    search,
    status,
    page,
    limit: PAGE_SIZE,
  });

  const notDeployed = error?.response?.status === 404;

  return (
    <>
      <PageHeader
        title="Clients"
        supportingText={
          isLoading ? "Loading companies…" : `${total.toLocaleString("en-US")} companies`
        }
        divider
      />
      <FilterBar
        tabs={STATUS_TABS}
        activeTab={status}
        onTabChange={(key) => {
          setStatus(key);
          setPage(1);
        }}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by company, admin or email"
      />
      {isError ? (
        <EmptyState
          icon="tabler:cloud-off"
          title={notDeployed ? "The server does not have this yet" : "Could not load clients"}
          description={
            notDeployed
              ? "GET /api/platform/companies answered 404: the backend has not deployed the console routes."
              : "Try again in a moment. If it keeps failing, check the server logs."
          }
        />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <BaseTable
            columns={columns}
            dataSource={rows}
            rowKey="id"
            loading={isLoading || isFetching}
            loadingLabel="Loading clients…"
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total,
              position: ["bottomCenter"],
              showSizeChanger: false,
              onChange: setPage,
            }}
            locale={{
              emptyText: (
                <EmptyState
                  compact
                  title="No clients match"
                  description="Change the status filter or the search."
                />
              ),
            }}
          />
        </div>
      )}
    </>
  );
};

export default PlatformClientsPage;
