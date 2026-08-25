import PropTypes from "prop-types";
import EmptyState from "../../../../../components/UX/emptyState/EmptyState";
import { StatusChip } from "../../../../../components/UX/profile";
import BaseTable from "../../../../../components/UX/tables/BaseTable";
import "../../../../../styles/global/ant-table.css";

/**
 * Faults reported against this device.
 *
 * These records used to share a table with the assignment history, which read
 * every row as if it had a nested `device` object. Pool records do not — `device`
 * is the serial string — so the shared status column silently rendered a lost
 * device as "Returned". Their own columns say what was actually recorded: the
 * condition, who reported it, and the note they left.
 */
const toneForCondition = (condition) => {
  const value = String(condition ?? "").toLowerCase();
  if (value === "lost") return "critical";
  if (value === "operational") return "success";
  return "warning";
};

const formatWhen = (timestamp) => {
  if (!timestamp) return "—";
  const date = new Date(Number(timestamp));
  return Number.isNaN(date.getTime()) ? "—" : date.toUTCString();
};

const TableIssuesPerDevice = ({ rows, isLoading }) => {
  const columns = [
    {
      title: "Condition",
      dataIndex: "condition",
      key: "condition",
      width: "18%",
      sorter: (a, b) => String(a.condition).localeCompare(b.condition),
      render: (condition) => (
        <StatusChip tone={toneForCondition(condition)} pip label={condition} />
      ),
    },
    {
      title: "Reported",
      dataIndex: "reportedAt",
      key: "reportedAt",
      width: "26%",
      responsive: ["md"],
      sorter: (a, b) => Number(a.reportedAt ?? 0) - Number(b.reportedAt ?? 0),
      render: (reportedAt) => (
        <span className="profile-date__exact">{formatWhen(reportedAt)}</span>
      ),
    },
    {
      title: "Note",
      dataIndex: "comment",
      key: "comment",
      render: (comment) => comment || "—",
    },
    {
      title: "Held by",
      dataIndex: "user",
      key: "user",
      width: "22%",
      responsive: ["lg"],
      render: (user) => user || "—",
    },
  ];

  if (!isLoading && rows.length === 0) {
    return (
      <EmptyState
        compact
        icon="tabler:shield-check"
        title="No faults reported"
        description="Nothing has been reported lost or damaged for this device at this event."
      />
    );
  }

  return (
    <BaseTable
      className="profile-table"
      columns={columns}
      dataSource={rows}
      loading={isLoading}
      enablePagination={rows.length > 10}
      pageSize={10}
    />
  );
};

TableIssuesPerDevice.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      condition: PropTypes.string,
      comment: PropTypes.string,
      user: PropTypes.string,
      reportedAt: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    })
  ).isRequired,
  isLoading: PropTypes.bool,
};

TableIssuesPerDevice.defaultProps = {
  isLoading: false,
};

export default TableIssuesPerDevice;
