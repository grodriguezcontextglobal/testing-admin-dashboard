import PropTypes from "prop-types";
import EmptyState from "../../../components/UX/emptyState/EmptyState";
import {
  LoanDateCell,
  ProfileErrorState,
  ProfileSkeleton,
  StatusChip,
} from "../../../components/UX/profile";
import BaseTable from "../../../components/UX/tables/BaseTable";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import { getDeviceState } from "../hooks/useConsumerAssignedDevices";

const PAGE_SIZE = 10;

// Lost first, then still-out, then returned — same principle as the member
// table: whatever needs a human reads at the top.
const STATE_ORDER = { lost: 0, out: 1, returned: 2 };

const currency = (value) =>
  `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const columns = [
  {
    title: "Status",
    key: "status",
    width: 130,
    defaultSortOrder: "ascend",
    sorter: (a, b) =>
      STATE_ORDER[getDeviceState(a.status).key] -
      STATE_ORDER[getDeviceState(b.status).key],
    render: (_, record) => {
      const state = getDeviceState(record.status);
      return <StatusChip tone={state.tone} pip label={state.label} />;
    },
  },
  {
    title: "Serial",
    dataIndex: "serialNumber",
    key: "serialNumber",
    render: (value) => <span className="profile-serial">{value}</span>,
  },
  {
    title: "Device",
    dataIndex: "deviceType",
    key: "deviceType",
  },
  {
    title: "Event",
    dataIndex: "eventSelected",
    key: "eventSelected",
    render: (value) => value || "—",
  },
  {
    title: "Assigned",
    dataIndex: "assignedAt",
    key: "assignedAt",
    render: (value) => <LoanDateCell value={value} />,
  },
  {
    title: "Value",
    dataIndex: "deviceValue",
    key: "deviceValue",
    align: "right",
    sorter: (a, b) => Number(a.deviceValue || 0) - Number(b.deviceValue || 0),
    render: (value) => (
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{currency(value)}</span>
    ),
  },
];

const ConsumerDevicesTable = ({ rows, isLoading, isError, onRetry }) => {
  if (isLoading) {
    return (
      <div style={{ padding: "20px" }}>
        <ProfileSkeleton lines={4} />
      </div>
    );
  }

  if (isError) {
    return (
      <ProfileErrorState
        title="Couldn't load assigned devices"
        description="The inventory service didn't respond. Nothing was changed."
        action={<GrayButtonComponent title={"Try again"} func={onRetry} />}
      />
    );
  }

  return (
    <BaseTable
      className="profile-table"
      rowKey="key"
      size="large"
      columns={columns}
      dataSource={rows}
      enablePagination={rows.length > PAGE_SIZE}
      pageSize={PAGE_SIZE}
      locale={{
        emptyText: (
          <EmptyState
            compact
            icon="tabler:device-laptop-off"
            title="No devices assigned"
            description="This consumer isn't holding anything right now."
          />
        ),
      }}
    />
  );
};

ConsumerDevicesTable.propTypes = {
  rows: PropTypes.array,
  isLoading: PropTypes.bool,
  isError: PropTypes.bool,
  onRetry: PropTypes.func,
};

ConsumerDevicesTable.defaultProps = {
  rows: [],
  isLoading: false,
  isError: false,
  onRetry: () => {},
};

export default ConsumerDevicesTable;
