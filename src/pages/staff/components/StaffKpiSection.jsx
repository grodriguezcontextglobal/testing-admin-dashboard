import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";
import ReactECharts from "echarts-for-react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import { useRoleLabel } from "../../../hooks/useRoleLabel";

/**
 * KPI strip for the staff page: total staff, active members, pending
 * invitations, plus a small role-distribution donut. Shares the
 * "employeesPerCompanyList" query with the staff table so no extra
 * network round-trip is made.
 */

const cardStyle = {
  background: "#fff",
  border: "1px solid var(--gray-200, #ddded6)",
  borderRadius: "12px",
  boxShadow: "var(--shadow-xs)",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  minWidth: 0,
  textAlign: "left",
};

const labelStyle = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  lineHeight: "20px",
  fontWeight: 500,
  color: "var(--gray-600, #5d615a)",
};

const valueStyle = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontSize: "30px",
  lineHeight: "38px",
  fontWeight: 600,
  color: "var(--gray-900, #171d1a)",
};

// Brand-family palette for the 5 role buckets (root -> staff).
const ROLE_COLORS = ["#021833", "#155eef", "#35465c", "#9a9d93", "#c6c7bb"];

const KpiCard = ({ icon, label, value }) => (
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
      <p style={labelStyle}>{label}</p>
    </div>
    <p style={valueStyle}>{value}</p>
  </div>
);

KpiCard.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
};

const StaffKpiSection = () => {
  const { user } = useSelector((state) => state.admin);
  const roleLabel = useRoleLabel();
  const companiesEmployees = useQuery({
    queryKey: ["employeesPerCompanyList"],
    queryFn: () =>
      devitrakApi.post("/company/search-company", {
        _id: user.companyData.id,
      }),
    enabled: !!user?.companyData?.id && user.companyData.id !== "",
  });

  if (companiesEmployees.isLoading) return null;

  const employees =
    companiesEmployees?.data?.data?.company?.[0]?.employees ?? [];
  const totalStaff = employees.length;
  const pendingInvitations = employees.filter(
    (member) => member.status === "Pending"
  ).length;
  const activeMembers = employees.filter(
    (member) =>
      member.status !== "Pending" &&
      (member.active === true ||
        String(member.active).toLowerCase() === "active" ||
        String(member.active).toLowerCase() === "true")
  ).length;

  const roleCount = employees.reduce((acc, member) => {
    const roleKey = Number(member.role);
    acc[roleKey] = (acc[roleKey] ?? 0) + 1;
    return acc;
  }, {});
  const donutData = Object.entries(roleCount)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([roleKey, count]) => ({
      name: roleLabel(roleKey) || `Role ${roleKey}`,
      value: count,
      itemStyle: {
        color: ROLE_COLORS[Number(roleKey) % ROLE_COLORS.length],
      },
    }));

  // Fixed-size centered donut; the legend is plain HTML beside it (echarts'
  // own legend collided with the pie inside a small card).
  const donutOption = {
    tooltip: {
      trigger: "item",
      backgroundColor: "#171d1a",
      borderWidth: 0,
      borderRadius: 8,
      textStyle: { color: "#fff", fontFamily: "Inter", fontSize: 12 },
    },
    legend: { show: false },
    series: [
      {
        type: "pie",
        radius: ["62%", "92%"],
        center: ["50%", "50%"],
        label: { show: false },
        labelLine: { show: false },
        itemStyle: { borderColor: "#fff", borderWidth: 2 },
        data: donutData,
      },
    ],
  };

  return (
    <div
      style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px",
        margin: "20px 0 4px",
      }}
    >
      <KpiCard icon="tabler:users" label="Total staff" value={totalStaff} />
      <KpiCard
        icon="tabler:user-check"
        label="Active members"
        value={activeMembers}
      />
      <KpiCard
        icon="tabler:mail-forward"
        label="Pending invitations"
        value={pendingInvitations}
      />
      <div style={{ ...cardStyle, padding: "16px 24px", gap: "4px" }}>
        <p style={labelStyle}>Role distribution</p>
        {donutData.length > 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              minWidth: 0,
            }}
          >
            <ReactECharts
              option={donutOption}
              style={{ width: 96, height: 96, flexShrink: 0 }}
              opts={{ renderer: "svg" }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                minWidth: 0,
              }}
            >
              {donutData.map((d) => (
                <span
                  key={d.name}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    color: "var(--gray-600, #5d615a)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "9999px",
                      background: d.itemStyle.color,
                      flexShrink: 0,
                    }}
                  />
                  {d.name} · {d.value}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p
            style={{
              ...labelStyle,
              fontWeight: 400,
              color: "var(--gray-500, #777b73)",
            }}
          >
            No staff members yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default StaffKpiSection;
