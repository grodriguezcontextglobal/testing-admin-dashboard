import PropTypes from "prop-types";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import EmptyState from "../../../../components/UX/emptyState/EmptyState";
import { ProfileSkeleton, StatusChip } from "../../../../components/UX/profile";
import BaseTable from "../../../../components/UX/tables/BaseTable";
import { formatAssignedAt } from "../utils/staffProfileSummary";

/**
 * The contracts behind one assigned device — the expanded row of the devices
 * table.
 *
 * It used to re-derive, inside the row, both permission flags the parent table
 * had already computed (`[0, 1].includes(Number(role))` on the company employee
 * record) and re-group the whole lease list by verification id to build a query
 * string. Both now arrive as props: one place decides who may see a contract.
 */
const DeviceDocumentsTable = ({
  documents,
  isLoading,
  isError,
  canSign,
  canReview,
  onOpen,
}) => {
  if (isLoading) return <ProfileSkeleton lines={2} />;

  if (isError) {
    return (
      <EmptyState
        compact
        icon="tabler:file-alert"
        title="Couldn't load the documents"
        description="The service didn't respond. Nothing was changed."
      />
    );
  }

  const rows = Array.isArray(documents) ? documents : [];

  if (rows.length === 0) {
    return (
      <EmptyState
        compact
        icon="tabler:file-off"
        title="No documents on this assignment"
        description="Nothing was attached when this device was handed over."
      />
    );
  }

  const columns = [
    { key: "title", title: "Document", dataIndex: "title" },
    {
      key: "signed",
      title: "Signature",
      dataIndex: "signed",
      render: (signed) => (
        <StatusChip
          tone={signed ? "success" : "warning"}
          pip
          label={signed ? "Signed" : "Pending"}
        />
      ),
    },
    {
      key: "date",
      title: "Signed on",
      dataIndex: "date",
      render: (date, row) =>
        row.signed ? formatAssignedAt(date) : <span>Not signed yet</span>,
    },
    {
      key: "actions",
      title: "",
      align: "right",
      render: (_, row) => {
        // The person the device belongs to signs; an administrator reviews what
        // was signed. Nobody else gets a button.
        if (canSign) {
          return (
            <BlueButtonComponent
              size="sm"
              title={row.signed ? "View" : "Review & sign"}
              buttonType="button"
              func={() => onOpen?.(row, "sign")}
            />
          );
        }
        if (canReview && row.signed) {
          return (
            <BlueButtonComponent
              size="sm"
              title="View"
              buttonType="button"
              func={() => onOpen?.(row, "review")}
            />
          );
        }
        return null;
      },
    },
  ];

  return (
    <BaseTable
      className="profile-table"
      columns={columns}
      dataSource={rows}
      rowKey={(row) => row.key ?? row.url}
      enablePagination={rows.length > 10}
      pageSize={10}
      size="small"
    />
  );
};

DeviceDocumentsTable.propTypes = {
  documents: PropTypes.array,
  isLoading: PropTypes.bool,
  isError: PropTypes.bool,
  canSign: PropTypes.bool,
  canReview: PropTypes.bool,
  onOpen: PropTypes.func,
};

export default DeviceDocumentsTable;
