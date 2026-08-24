import PropTypes from "prop-types";
import { useState } from "react";
import { DoubleRightChevronIcon } from "../../../../components/icons/DoubleRightChevronIcon.jsx";
import DownDoubleArrowIcon from "../../../../components/icons/DownDoubleArrowIcon.jsx";
import DangerButtonConfirmationComponent from "../../../../components/UX/buttons/DangerButtonConfirmation";
import EmptyState from "../../../../components/UX/emptyState/EmptyState";
import { ProfileSkeleton, StatusChip } from "../../../../components/UX/profile";
import BaseTable from "../../../../components/UX/tables/BaseTable.jsx";
import ModalReturnDeviceFromStaff from "./equipment_components/ModalReturnDeviceFromStaff";
import DeviceDocumentsTable from "./DeviceDocumentsTable";
import { formatAssignedAt, formatMoney } from "../utils/staffProfileSummary";

/**
 * What this person is holding.
 *
 * Rows are built by `deviceRowsForStaff` before they reach the table. They used
 * to be joined to inventory inside four separate column renderers, each calling
 * the same lookup helper again — and that helper read
 * `images[group].at(-1).source` with no guard, so one item group without a photo
 * threw a TypeError and blanked the whole section.
 *
 * Other things the old table did: two of its columns and its action column all
 * carried `key: "address"`; the assignment date was printed with
 * `toUTCString()` ("Mon, 01 Jun 2026 10:00:00 GMT"); the value was a bare `$`
 * concatenated with the raw cost field; and the two permission flags were held
 * in `useState` and filled by an effect with an empty dependency array, so they
 * were a render behind on first paint.
 */
const AssignedDevicesTable = ({
  rows,
  isLoading,
  verificationById,
  canManage,
  isOwnProfile,
  onOpenDocument,
}) => {
  const [expandedKey, setExpandedKey] = useState(null);
  const [deviceToReturn, setDeviceToReturn] = useState(null);

  const canSeeDocuments = canManage || isOwnProfile;

  if (isLoading) return <ProfileSkeleton lines={3} />;

  const columns = [
    {
      key: "device",
      title: "Device",
      dataIndex: "itemGroup",
      sorter: (a, b) => a.itemGroup.localeCompare(b.itemGroup),
      render: (itemGroup) => itemGroup || "Unknown device",
    },
    {
      key: "serial",
      title: "Serial",
      dataIndex: "serialNumber",
      render: (serialNumber) =>
        serialNumber ? (
          <span className="profile-serial">{serialNumber}</span>
        ) : (
          <span>—</span>
        ),
    },
    {
      key: "assignedAt",
      title: "Assigned",
      dataIndex: "assignedAt",
      sorter: (a, b) => new Date(a.assignedAt ?? 0) - new Date(b.assignedAt ?? 0),
      render: (assignedAt) => formatAssignedAt(assignedAt),
    },
    {
      key: "cost",
      title: "Value",
      dataIndex: "cost",
      align: "right",
      sorter: (a, b) => a.cost - b.cost,
      render: (cost) => formatMoney(cost),
    },
    {
      key: "state",
      title: "State",
      dataIndex: "isOut",
      render: (isOut) => (
        <StatusChip
          tone={isOut ? "action" : "success"}
          pip
          label={isOut ? "Out" : "Returned"}
        />
      ),
    },
    ...(canSeeDocuments
      ? [
          {
            key: "contract",
            title: "Contract",
            render: (_, row) => {
              const query = verificationById?.[row.verificationId];
              if (!row.verificationId) return <span>—</span>;
              if (query?.isLoading) return <span>Checking…</span>;
              if (query?.isError) return <StatusChip tone="warning" label="Unknown" />;
              return (
                <StatusChip
                  tone={query?.data?.allSigned ? "success" : "warning"}
                  pip
                  label={query?.data?.allSigned ? "Signed" : "Pending"}
                />
              );
            },
          },
        ]
      : []),
    ...(canManage
      ? [
          {
            key: "actions",
            title: "",
            align: "right",
            render: (_, row) => (
              <div className="profile-row-actions">
                <DangerButtonConfirmationComponent
                  size="sm"
                  title="Mark as returned"
                  buttonType="button"
                  disabled={!row.isOut}
                  confirmationTitle={`Return ${row.serialNumber || "this device"}?`}
                  confirmationDescription="The unit goes back into the warehouse and the lease is closed."
                  okText="Return"
                  func={() => setDeviceToReturn(row)}
                />
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
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
              icon="tabler:devices-off"
              title="No devices assigned"
              description={
                canManage
                  ? "Use “Assign a device” above to hand equipment to this person."
                  : "This person is not holding any equipment."
              }
            />
          ),
        }}
        expandable={
          canSeeDocuments
            ? {
                expandedRowKeys: expandedKey ? [expandedKey] : [],
                onExpand: (expanded, row) =>
                  setExpandedKey(expanded ? row.key : null),
                rowExpandable: (row) => Boolean(row.verificationId),
                expandedRowRender: (row) => {
                  const query = verificationById?.[row.verificationId];
                  return (
                    <DeviceDocumentsTable
                      documents={query?.data?.docs}
                      isLoading={query?.isLoading}
                      isError={query?.isError}
                      canSign={isOwnProfile}
                      canReview={canManage}
                      onOpen={(doc, mode) => onOpenDocument?.(row, doc, mode)}
                    />
                  );
                },
                expandIcon: ({ expanded, onExpand, record }) =>
                  record.verificationId ? (
                    <span
                      onClick={(event) => onExpand(record, event)}
                      role="button"
                      tabIndex={0}
                      aria-label={
                        expanded ? "Hide documents" : "Show documents"
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          onExpand(record, event);
                        }
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        cursor: "pointer",
                        padding: "4px",
                      }}
                    >
                      {expanded ? (
                        <DownDoubleArrowIcon />
                      ) : (
                        <DoubleRightChevronIcon />
                      )}
                    </span>
                  ) : null,
              }
            : undefined
        }
      />

      {deviceToReturn && (
        <ModalReturnDeviceFromStaff
          openReturnDeviceStaffModal
          setOpenReturnDeviceStaffModal={() => setDeviceToReturn(null)}
          // The modal reads the lease fields flat and the inventory record under
          // `item_id_info`, which is the shape it has always been handed.
          deviceInfo={{
            ...deviceToReturn.lease,
            item_id_info: deviceToReturn.item,
            devicePhoto: deviceToReturn.photo,
          }}
        />
      )}
    </>
  );
};

AssignedDevicesTable.propTypes = {
  rows: PropTypes.array.isRequired,
  isLoading: PropTypes.bool,
  /** verification id → the React Query result for its documents. */
  verificationById: PropTypes.object,
  canManage: PropTypes.bool,
  isOwnProfile: PropTypes.bool,
  onOpenDocument: PropTypes.func,
};

export default AssignedDevicesTable;
