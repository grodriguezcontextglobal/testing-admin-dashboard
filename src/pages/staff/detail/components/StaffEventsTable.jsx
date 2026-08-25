import PropTypes from "prop-types";
import EmptyState from "../../../../components/UX/emptyState/EmptyState";
import { ProfileSkeleton, StatusChip } from "../../../../components/UX/profile";
import BaseTable from "../../../../components/UX/tables/BaseTable";

/**
 * The events this person works.
 *
 * The rows come from `staffEventRows`, which is also what feeds the header's
 * "current event" chip — the two used to be separate walks of the same list
 * with different rules: the header collected matches into a `Set` of objects it
 * had just built (so nothing ever deduplicated) and only looked at active
 * events, while this table looked at all of them and labelled the status chip
 * "Active"/"Completed" using `color={status ? "info" : "success"}` — green for
 * the finished ones and blue for the live ones, which reads backwards.
 */
const StaffEventsTable = ({ rows, isLoading }) => {
  if (isLoading) return <ProfileSkeleton lines={3} />;

  const columns = [
    {
      key: "event",
      title: "Event",
      dataIndex: "event",
      sorter: (a, b) => a.event.localeCompare(b.event),
    },
    {
      key: "role",
      title: "Role here",
      dataIndex: "role",
      responsive: ["lg"],
      sorter: (a, b) => a.role.localeCompare(b.role),
      render: (role) => <StatusChip label={role} />,
    },
    {
      key: "active",
      title: "Status",
      dataIndex: "active",
      sorter: (a, b) => Number(a.active) - Number(b.active),
      render: (active) => (
        <StatusChip
          tone={active ? "success" : "neutral"}
          pip
          label={active ? "Running" : "Closed"}
        />
      ),
    },
  ];

  return (
    <BaseTable
      className="profile-table"
      columns={columns}
      dataSource={rows}
      rowKey={(row) => row.key}
      enablePagination={rows.length > 10}
      pageSize={10}
      locale={{
        emptyText: (
          <EmptyState
            compact
            icon="tabler:calendar-off"
            title="Not on any event"
            description="Use “Manage → Assign to an event” to put this person on one."
          />
        ),
      }}
    />
  );
};

StaffEventsTable.propTypes = {
  rows: PropTypes.array.isRequired,
  isLoading: PropTypes.bool,
};

export default StaffEventsTable;
