import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import { getEventStatus } from "../../events/utils/getEventStatus";

/**
 * Home dashboard KPI strip. Derives everything from two queries that other
 * pages already use (["events"], ["itemsList"]) — no new endpoints.
 */
const cardStyle = {
  background: "var(--base-white, #fff)",
  border: "1px solid var(--gray-200, #ddded6)",
  borderRadius: "12px",
  boxShadow: "var(--shadow-xs)",
  padding: "20px 24px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  minWidth: 0,
  textAlign: "left",
};

const KpiCard = ({ icon, label, value, hint }) => (
  <div style={cardStyle}>
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "40px",
          height: "40px",
          borderRadius: "8px",
          background: "var(--gray-50, #f7f7f4)",
          color: "var(--brand-600, #021833)",
          flexShrink: 0,
        }}
      >
        <Icon icon={icon} width={20} height={20} />
      </span>
      <p
        style={{
          margin: 0,
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          fontWeight: 500,
          color: "var(--gray-600, #5d615a)",
        }}
      >
        {label}
      </p>
    </div>
    <p
      style={{
        margin: 0,
        fontFamily: "Inter, sans-serif",
        fontSize: "30px",
        lineHeight: "38px",
        fontWeight: 600,
        color: "var(--gray-900, #171d1a)",
      }}
    >
      {value}
      {hint && (
        <span
          style={{
            marginLeft: "8px",
            fontSize: "13px",
            lineHeight: "18px",
            fontWeight: 500,
            color: "var(--gray-500, #777b73)",
          }}
        >
          {hint}
        </span>
      )}
    </p>
  </div>
);

KpiCard.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  hint: PropTypes.node,
};

export const sumDeviceSetup = (event) =>
  (event?.deviceSetup ?? []).reduce(
    (acc, d) => acc + (Number(d.quantity) || 0),
    0
  );

const HomeKpiSection = () => {
  // Company-wide status strip: inventory, devices out, team, consumers,
  // events. Every number reuses a query some other page already makes
  // (shared query keys), so this row adds no extra network cost.
  const { user } = useSelector((state) => state.admin);
  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: () =>
      devitrakApi.get(
        `/event/event-list-per-company?company=${user.company}&type=event`
      ),
    enabled: !!user.companyData.id,
  });
  const inventoryQuery = useQuery({
    queryKey: ["itemsList"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
      }),
    refetchOnMount: false,
  });
  const companyQuery = useQuery({
    queryKey: ["companiesList"],
    queryFn: () =>
      devitrakApi.post("/company/search-company", {
        _id: user.companyData.id,
      }),
    refetchOnMount: false,
  });
  const consumersQuery = useQuery({
    queryKey: ["allConsumersBasedOnEventsPerCompany"],
    queryFn: () =>
      devitrakApi.get(
        `/auth/all-consumers-based-on-all-events-per-company/${user.companyData.id}`
      ),
    enabled: !!user.companyData.id,
    staleTime: 5 * 60 * 1000,
  });

  const events = eventsQuery.data?.data?.list ?? [];
  const withStatus = events.map((e) => ({ e, status: getEventStatus(e).key }));
  const liveEvents = withStatus.filter((x) => x.status === "live");
  const upcomingEvents = withStatus.filter((x) => x.status === "upcoming");

  const items = inventoryQuery.data?.data?.items ?? [];
  const inventoryUnits = items.length;
  // warehouse: 1 = in stock, 0 = checked out (same grouping the donut uses)
  const devicesOut = items.filter((i) => Number(i.warehouse) === 0).length;

  const employees =
    companyQuery.data?.data?.company?.[0]?.employees ?? [];
  const activeStaff = employees.filter(
    (m) =>
      m.status !== "Pending" &&
      (m.active === true ||
        String(m.active).toLowerCase() === "active" ||
        String(m.active).toLowerCase() === "true")
  ).length;

  const totalConsumers =
    consumersQuery.data?.data?.result?.totalConsumers ?? 0;

  return (
    <div
      style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "16px",
        margin: "0 0 16px",
      }}
    >
      <KpiCard
        icon="tabler:box"
        label="Inventory units"
        value={inventoryUnits}
      />
      <KpiCard
        icon="tabler:device-mobile-share"
        label="Devices out"
        value={devicesOut}
        hint={inventoryUnits > 0 ? `of ${inventoryUnits}` : undefined}
      />
      <KpiCard
        icon="tabler:users"
        label="Team members"
        value={employees.length}
        hint={employees.length > 0 ? `${activeStaff} active` : undefined}
      />
      <KpiCard
        icon="tabler:user-heart"
        label="Consumers"
        value={totalConsumers}
      />
      <KpiCard
        icon="tabler:broadcast"
        label="Live events"
        value={liveEvents.length}
      />
      <KpiCard
        icon="tabler:calendar-time"
        label="Upcoming events"
        value={upcomingEvents.length}
      />
    </div>
  );
};

export default HomeKpiSection;
