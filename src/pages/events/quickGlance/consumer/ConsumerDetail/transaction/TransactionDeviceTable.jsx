import PropTypes from "prop-types";
import EmptyState from "../../../../../../components/UX/emptyState/EmptyState";
import { StatusChip } from "../../../../../../components/UX/profile";
import BaseTable from "../../../../../../components/UX/tables/BaseTable";
import DangerButtonConfirmationComponent from "../../../../../../components/UX/buttons/DangerButtonConfirmation";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import LightBlueButtonComponent from "../../../../../../components/UX/buttons/LigthBlueButton";
import { describeDeviceState } from "../../utils/consumerActivity";

/**
 * The devices on one transaction.
 *
 * Row actions are secondary buttons in a fixed order — Return, Replace, Report
 * lost — so the same action sits in the same place on every row. The previous
 * version rebuilt the button set per row out of nested ternaries, and switched
 * a row's first button between "Assign" (blue, primary) and "Return" (red,
 * destructive) depending on state, so the button under your cursor changed
 * meaning as the table refreshed.
 *
 * "Report lost" is destructive and irreversible: it writes the device off,
 * releases it from the pool and opens the fee flow. It stays a danger button
 * behind a confirmation, and only for the event's admins.
 */
const TransactionDeviceTable = ({
  rows,
  isEventActive,
  canWriteOff,
  busyKey,
  onReturn,
  onAssign,
  onReplace,
  onReportLost,
  rowSelection,
}) => {
  const columns = [
    {
      title: "Serial number",
      dataIndex: "serialNumber",
      key: "serialNumber",
      width: "28%",
      sorter: (a, b) => String(a.serialNumber).localeCompare(b.serialNumber),
      render: (serialNumber) => (
        <span className="profile-serial">{serialNumber || "—"}</span>
      ),
    },
    {
      title: "Type",
      dataIndex: "deviceType",
      key: "deviceType",
      width: "24%",
      responsive: ["md"],
      sorter: (a, b) => String(a.deviceType).localeCompare(b.deviceType),
      render: (deviceType) => (
        <span style={{ textTransform: "capitalize" }}>{deviceType || "—"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "18%",
      sorter: (a, b) =>
        describeDeviceState(a.status).label.localeCompare(
          describeDeviceState(b.status).label
        ),
      render: (status) => {
        const state = describeDeviceState(status);
        return <StatusChip tone={state.tone} pip label={state.label} />;
      },
    },
    {
      title: "",
      key: "actions",
      align: "right",
      render: (_, record) => {
        const state = describeDeviceState(record.status);
        const isBusy = record.key === busyKey;

        // A written-off device is final: nothing can be done to it here.
        if (state.key === "lost") {
          return (
            <span className="profile-row-actions">
              <GrayButtonComponent title="Lost" disabled size="sm" />
            </span>
          );
        }

        if (state.key === "out") {
          return (
            <span className="profile-row-actions">
              <LightBlueButtonComponent
                title="Return"
                size="sm"
                disabled={!isEventActive}
                loadingState={isBusy}
                func={() => onReturn(record)}
              />
              <GrayButtonComponent
                title="Replace"
                size="sm"
                disabled={!isEventActive}
                func={() => onReplace(record)}
              />
              {canWriteOff && (
                <DangerButtonConfirmationComponent
                  title="Report lost"
                  size="sm"
                  disabled={!isEventActive}
                  confirmationTitle={`Report ${
                    record.serialNumber || "this device"
                  } as lost?`}
                  confirmationDescription="The device is written off, released from the pool, and the fee flow opens next."
                  okText="Report lost"
                  func={() => onReportLost(record)}
                />
              )}
            </span>
          );
        }

        // Returned: the only sensible next step is handing it out again.
        return (
          <span className="profile-row-actions">
            <LightBlueButtonComponent
              title="Assign again"
              size="sm"
              disabled={!isEventActive}
              loadingState={isBusy}
              func={() => onAssign(record)}
            />
          </span>
        );
      },
    },
  ];

  if (rows.length === 0) {
    return (
      <EmptyState
        compact
        icon="tabler:device-tablet-off"
        title="No devices on this transaction yet"
        description="Scan a serial number above to hand the first one over."
      />
    );
  }

  return (
    <BaseTable
      className="profile-table"
      columns={columns}
      dataSource={rows}
      enablePagination={rows.length > 10}
      pageSize={10}
      rowSelection={rowSelection}
    />
  );
};

TransactionDeviceTable.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      serialNumber: PropTypes.string,
      deviceType: PropTypes.string,
      status: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    })
  ).isRequired,
  isEventActive: PropTypes.bool,
  canWriteOff: PropTypes.bool,
  busyKey: PropTypes.string,
  onReturn: PropTypes.func.isRequired,
  onAssign: PropTypes.func.isRequired,
  onReplace: PropTypes.func.isRequired,
  onReportLost: PropTypes.func.isRequired,
  rowSelection: PropTypes.object,
};

TransactionDeviceTable.defaultProps = {
  isEventActive: true,
  canWriteOff: false,
  busyKey: null,
  rowSelection: undefined,
};

export default TransactionDeviceTable;
