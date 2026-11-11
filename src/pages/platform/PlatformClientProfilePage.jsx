import PropTypes from "prop-types";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import Breadcrumb from "../../components/UX/breadcrumbs/Breadcrumb";
import GrayButtonComponent from "../../components/UX/buttons/GrayButton";
import FilterBar from "../../components/UX/filterBar/FilterBar";
import PillUIComponent from "../../components/UX/Chip/PillUIComponent";
import {
  ProfileErrorState,
  ProfileIdentityCard,
  ProfileSection,
  ProfileShell,
  ProfileSkeleton,
  ProfileStatTiles,
  ProfileTabs,
  StatusChip,
} from "../../components/UX/profile";
import BaseTable from "../../components/UX/tables/BaseTable";
import EmptyState from "../../components/UX/emptyState/EmptyState";
import {
  usePlatformCompany,
  usePlatformCompanySection,
} from "../../hooks/platform/usePlatformCompanyProfile";
import {
  ACTIVITY_CATEGORIES,
  CLIENT_PROFILE_TABS,
  RECORD_FIELDS,
  SECTION_COLUMNS,
  companyFactGroups,
  companyStatTiles,
  formatSectionValue,
  resolveProfileTab,
  sectionStatusTone,
} from "./utils/clientProfile";
import { companyStatusPill } from "./utils/platformClients";

/**
 * One client company, everything about it (plan F7, design board ClientDetail).
 * Built on ProfileShell: breadcrumb → identity → stats → tabs → content.
 * Read-only in v1. Each tab asks the server only when it is opened.
 */

const PAGE_SIZE = 25;

const breadcrumbLinkStyle = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontSize: "18px",
  lineHeight: "28px",
  fontWeight: 600,
  color: "var(--gray600, #475467)",
};

const breadcrumbTitleStyle = { ...breadcrumbLinkStyle, color: "var(--gray900, #101828)" };

const notDeployed = (error) => error?.response?.status === 404;

const SectionError = ({ error, path, onRetry }) => (
  <ProfileErrorState
    title={notDeployed(error) ? "The server does not have this yet" : "Couldn't load this section"}
    description={
      notDeployed(error)
        ? `GET /api/platform${path} answered 404.`
        : "The service didn't respond. Nothing was changed."
    }
    action={notDeployed(error) ? null : <GrayButtonComponent title="Try again" func={onRetry} />}
  />
);

SectionError.propTypes = {
  error: PropTypes.object,
  path: PropTypes.string.isRequired,
  onRetry: PropTypes.func,
};

const toTableColumns = (columns) =>
  columns.map((column) => ({
    title: column.title,
    dataIndex: column.key,
    key: column.key,
    align: column.align,
    render: (value, row) =>
      column.format === "status" && value ? (
        <StatusChip label={formatSectionValue("status", value)} tone={sectionStatusTone(value)} />
      ) : (
        <span style={column.align === "right" ? { fontVariantNumeric: "tabular-nums" } : undefined}>
          {formatSectionValue(column.format, value, row)}
        </span>
      ),
  }));

const RecordList = ({ fields, record }) => (
  <dl
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "16px 24px",
      margin: 0,
      padding: "0 20px 20px",
    }}
  >
    {fields.map((field) => (
      <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <dt style={{ fontSize: "13px", color: "var(--gray600, #475467)" }}>{field.label}</dt>
        <dd style={{ margin: 0, fontSize: "14px", fontWeight: 500, color: "var(--gray900, #101828)" }}>
          {formatSectionValue(field.format, record?.[field.key], record)}
        </dd>
      </div>
    ))}
  </dl>
);

RecordList.propTypes = {
  fields: PropTypes.arrayOf(PropTypes.object).isRequired,
  record: PropTypes.object,
};

const OverviewTab = ({ company }) => {
  const alerts = Array.isArray(company?.alerts) ? company.alerts : [];
  return (
    <>
      <ProfileSection title="Needs attention" count={alerts.length} testId="platform-client-alerts">
        {alerts.length === 0 ? (
          <EmptyState compact title="Nothing needs attention" description="No open alerts for this client." />
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: "0 20px 20px", display: "grid", gap: "8px" }}>
            {alerts.map((alert, index) => (
              <li
                // Alerts have no id in the proposed shape; order is the server's.
                key={`${alert.kind}-${index}`}
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <StatusChip
                  label={formatSectionValue("status", alert.kind)}
                  tone={sectionStatusTone(alert.kind) === "critical" ? "critical" : "warning"}
                />
                <span style={{ fontSize: "14px" }}>{alert.message}</span>
              </li>
            ))}
          </ul>
        )}
      </ProfileSection>
      <ProfileSection title="At a glance" testId="platform-client-glance">
        <RecordList fields={RECORD_FIELDS.overview} record={company} />
      </ProfileSection>
    </>
  );
};

OverviewTab.propTypes = { company: PropTypes.object };

const SectionTab = ({ companyId, tab }) => {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("all");
  const section = usePlatformCompanySection(companyId, tab.resource, {
    page,
    limit: PAGE_SIZE,
    category: tab.key === "activity" ? category : undefined,
  });
  const path = `/companies/${companyId}/${tab.resource}`;

  if (section.isError) {
    return (
      <ProfileSection title={tab.label}>
        <SectionError error={section.error} path={path} onRetry={() => section.refetch()} />
      </ProfileSection>
    );
  }

  if (tab.kind === "record") {
    return (
      <ProfileSection title={tab.label} testId={`platform-client-${tab.key}`}>
        {section.isLoading ? (
          <div style={{ padding: "0 20px 20px" }}>
            <ProfileSkeleton lines={4} />
          </div>
        ) : (
          <RecordList fields={RECORD_FIELDS[tab.key]} record={section.record} />
        )}
      </ProfileSection>
    );
  }

  return (
    <ProfileSection
      title={tab.label}
      count={section.isLoading ? undefined : section.total}
      testId={`platform-client-${tab.key}`}
    >
      {tab.key === "activity" && (
        <div style={{ padding: "0 20px 12px" }}>
          <FilterBar
            tabs={ACTIVITY_CATEGORIES}
            activeTab={category}
            onTabChange={(key) => {
              setCategory(key);
              setPage(1);
            }}
          />
        </div>
      )}
      <div style={{ overflowX: "auto", padding: "0 20px 20px" }}>
        <BaseTable
          columns={toTableColumns(SECTION_COLUMNS[tab.key])}
          dataSource={section.rows}
          rowKey={(row) => row.id ?? JSON.stringify(row)}
          loading={section.isLoading || section.isFetching}
          loadingLabel={`Loading ${tab.label.toLowerCase()}…`}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: section.total,
            position: ["bottomCenter"],
            showSizeChanger: false,
            onChange: setPage,
          }}
          locale={{
            emptyText: (
              <EmptyState compact title={`No ${tab.label.toLowerCase()} yet`} description="Nothing to show for this client." />
            ),
          }}
        />
      </div>
    </ProfileSection>
  );
};

SectionTab.propTypes = {
  companyId: PropTypes.string.isRequired,
  tab: PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    resource: PropTypes.string,
    kind: PropTypes.string.isRequired,
  }).isRequired,
};

const PlatformClientProfilePage = () => {
  const { companyId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeKey = resolveProfileTab(searchParams.get("tab"));
  const activeTab = CLIENT_PROFILE_TABS.find((tab) => tab.key === activeKey);
  const { company, isLoading, isError, error, refetch } = usePlatformCompany(companyId);

  const breadcrumb = (
    <Breadcrumb
      path={[
        {
          title: (
            <Link to="/platform/clients">
              <p style={breadcrumbLinkStyle}>Clients</p>
            </Link>
          ),
        },
        { title: <p style={breadcrumbTitleStyle}>{company?.name ?? "Client"}</p> },
      ]}
    />
  );

  if (isError) {
    return (
      <ProfileShell breadcrumb={breadcrumb}>
        <ProfileErrorState
          title={notDeployed(error) ? "Client not found" : "Couldn't load this client"}
          description={
            notDeployed(error)
              ? "GET /api/platform/companies/:id answered 404: the client does not exist, or the server does not have this route yet."
              : "The service didn't respond. Nothing was changed."
          }
          action={
            notDeployed(error) ? (
              <Link to="/platform/clients">
                <GrayButtonComponent title="Back to clients" />
              </Link>
            ) : (
              <GrayButtonComponent title="Try again" func={() => refetch()} />
            )
          }
        />
      </ProfileShell>
    );
  }

  if (isLoading) {
    return (
      <ProfileShell breadcrumb={breadcrumb}>
        <div style={{ padding: "8px 0" }}>
          <ProfileSkeleton lines={5} />
        </div>
      </ProfileShell>
    );
  }

  const pill = companyStatusPill(company?.status);

  return (
    <ProfileShell
      breadcrumb={breadcrumb}
      testId="platform-client-profile"
      identity={
        <ProfileIdentityCard
          name={company?.name ?? "Unnamed client"}
          imageUrl={company?.logoUrl}
          chips={[
            <PillUIComponent key="status" color={pill.color} size="sm">
              {pill.label}
            </PillUIComponent>,
          ]}
          factGroups={companyFactGroups(company)}
          testId="platform-client-header"
        />
      }
      stats={<ProfileStatTiles tiles={companyStatTiles(company)} testId="platform-client-stats" />}
      tabs={
        <ProfileTabs
          items={CLIENT_PROFILE_TABS.map(({ key, label }) => ({ key, label }))}
          activeKey={activeKey}
          ariaLabel="Client profile"
          onSelect={(key) => {
            const next = new URLSearchParams(searchParams);
            next.set("tab", key);
            setSearchParams(next, { replace: true });
          }}
        />
      }
    >
      {activeTab.kind === "overview" ? (
        <OverviewTab company={company} />
      ) : (
        // key: a new tab or client starts on page 1 with no filter.
        <SectionTab key={`${companyId}-${activeTab.key}`} companyId={companyId} tab={activeTab} />
      )}
    </ProfileShell>
  );
};

export default PlatformClientProfilePage;
