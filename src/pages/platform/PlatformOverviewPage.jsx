import { useState } from "react";
import { Link } from "react-router";
import EmptyState from "../../components/UX/emptyState/EmptyState";
import FilterBar from "../../components/UX/filterBar/FilterBar";
import PageHeader from "../../components/UX/pageHeader/PageHeader";
import {
  ProfileSection,
  ProfileSkeleton,
  ProfileStatTiles,
  StatusChip,
} from "../../components/UX/profile";
import BaseTable from "../../components/UX/tables/BaseTable";
import { usePlatformList, usePlatformSummary } from "../../hooks/platform/usePlatformLists";
import PlatformRequestError from "./components/PlatformRequestError";
import { toTableColumns } from "./components/platformColumns";
import { formatSectionValue, sectionStatusTone } from "./utils/clientProfile";
import { overviewTiles } from "./utils/platformScreens";

const RANGES = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
];

const ACTIVITY_COLUMNS = [
  { key: "at", title: "When", format: "relative" },
  { key: "companyName", title: "Client", format: "company" },
  { key: "actorName", title: "Who", format: "text" },
  { key: "summary", title: "What happened", format: "text" },
  { key: "category", title: "Category", format: "status" },
];

/** The whole platform at a glance (plan F7, design board Main). */
const PlatformOverviewPage = () => {
  const [range, setRange] = useState("30d");
  const summary = usePlatformSummary(range);
  const attention = usePlatformList("attention", { limit: 100 });
  const activity = usePlatformList("activity", { page: 1, limit: 10 });

  return (
    <>
      <PageHeader
        title="Overview"
        supportingText="Every Devitrak client: money, devices and what needs a look today."
        divider
      />
      <FilterBar tabs={RANGES} activeTab={range} onTabChange={setRange} />
      {summary.isError ? (
        <PlatformRequestError error={summary.error} path="/summary" onRetry={() => summary.refetch()} />
      ) : (
        <ProfileStatTiles tiles={overviewTiles(summary.summary)} testId="platform-overview-kpis" />
      )}

      <ProfileSection
        title="Needs attention"
        count={attention.isLoading ? undefined : attention.rows.length}
        description="Overdue devices, failed payments, trials ending and clients gone quiet."
        testId="platform-overview-attention"
      >
        {attention.isError ? (
          <PlatformRequestError error={attention.error} path="/attention" onRetry={() => attention.refetch()} />
        ) : attention.isLoading ? (
          <div style={{ padding: "0 20px 20px" }}>
            <ProfileSkeleton lines={4} />
          </div>
        ) : attention.rows.length === 0 ? (
          <EmptyState compact title="Nothing needs attention" description="Every client looks healthy." />
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: "0 20px 20px", display: "grid", gap: "10px" }}>
            {attention.rows.map((row) => (
              <li
                key={row.id}
                style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", fontSize: "14px" }}
              >
                <StatusChip
                  label={formatSectionValue("status", row.kind)}
                  tone={sectionStatusTone(row.kind) === "critical" ? "critical" : "warning"}
                />
                <Link
                  to={`/platform/clients/${encodeURIComponent(row.companyId)}`}
                  style={{ fontWeight: 600, color: "var(--blue-dark-600, #155eef)" }}
                >
                  {row.companyName}
                </Link>
                <span style={{ color: "var(--gray600, #475467)" }}>{row.reason}</span>
              </li>
            ))}
          </ul>
        )}
      </ProfileSection>

      <ProfileSection title="Latest activity" description="Across every client." testId="platform-overview-activity">
        {activity.isError ? (
          <PlatformRequestError error={activity.error} path="/activity" onRetry={() => activity.refetch()} />
        ) : (
          <div style={{ overflowX: "auto", padding: "0 20px 20px" }}>
            <BaseTable
              columns={toTableColumns(ACTIVITY_COLUMNS)}
              dataSource={activity.rows}
              rowKey="id"
              loading={activity.isLoading}
              loadingLabel="Loading activity…"
              pagination={false}
            />
          </div>
        )}
      </ProfileSection>
    </>
  );
};

export default PlatformOverviewPage;
