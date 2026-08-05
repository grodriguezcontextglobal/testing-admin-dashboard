import DatePicker from "react-datepicker";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import DangerButtonComponent from "../../../../components/UX/buttons/DangerButton";
import {
  getLoanStatus,
  LoanDateCell,
  StatusChip,
} from "../../../../components/UX/profile";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { pickMemberLoanDates } from "../../hooks/useMemberAssignedDevices";
import { updateExpectedReturnDate } from "./acions/EditRowInformation";
import "./style.css";

// Status leads. Before this column existed, a month-overdue Chromebook and one
// due in December were two identical rows of raw UTC text.
const STATUS_ORDER = { overdue: 0, "due-soon": 1, "on-loan": 2, returned: 3 };

export const columns = ({
  editing,
  setEditing,
  updateInfo,
  setUpdateInfo,
  refetch,
  queryClient,
  setChecked,
  setStoredRecord,
}) => {
  return [
    {
      title: "Status",
      key: "status",
      width: 140,
      defaultSortOrder: "ascend",
      sorter: (a, b) =>
        STATUS_ORDER[getLoanStatus(pickMemberLoanDates(a)).key] -
        STATUS_ORDER[getLoanStatus(pickMemberLoanDates(b)).key],
      render: (_, record) => {
        const status = getLoanStatus(pickMemberLoanDates(record));
        return <StatusChip tone={status.tone} pip label={status.label} />;
      },
    },
    {
      title: "Serial Number",
      dataIndex: "device_serial_number",
      key: "device_serial_number",
      render: (value) => <span className="profile-serial">{value}</span>,
    },
    {
      title: "Device Type",
      dataIndex: "device_item_group",
      key: "device_item_group",
    },
    {
      title: "Device Name",
      dataIndex: "device_category_name",
      key: "device_category_name",
    },
    {
      title: "Assigned",
      dataIndex: "assigned_date",
      key: "assigned_date",
      render: (value) => <LoanDateCell value={value} />,
    },
    {
      title: "Due",
      dataIndex: "expected_return_date",
      key: "expected_return_date",
      sorter: (a, b) =>
        new Date(a.expected_return_date ?? 0) - new Date(b.expected_return_date ?? 0),
      render: (value, record) => {
        const isEditing =
          editing.length > 0 &&
          editing.every((item) => item === record.device_id);
        if (isEditing) {
          const selectedDate = updateInfo?.expected_return_date
            ? new Date(updateInfo.expected_return_date)
            : value
            ? new Date(value)
            : null;
          return (
            <DatePicker
              id="calender-event"
              showTimeSelect
              minDate={new Date()}
              selected={selectedDate}
              onChange={(x) =>
                setUpdateInfo({ record, expected_return_date: x, refetch })
              }
              dateFormat="Pp"
              style={{
                ...OutlinedInputStyle,
                justifyContent: "flex-start !important",
                margin: 0,
                width: "auto",
                minWidth: 240,
                zIndex: 300,
              }}
              popperPlacement="bottom-start"
            />
          );
        }
        const status = getLoanStatus(pickMemberLoanDates(record));
        return (
          <LoanDateCell
            value={value}
            showRelative
            critical={status.tone === "critical"}
          />
        );
      },
    },
    {
      title: "",
      key: "actions",
      width: 180,
      render: (_, record) => {
        const isEditing =
          editing.length > 0 &&
          editing.every((item) => item === record.device_id);

        if (isEditing) {
          return (
            <div className="profile-row-actions" style={{ width: "100%" }}>
              <GrayButtonComponent
                title={"Update"}
                size="sm"
                func={async () => {
                  await updateExpectedReturnDate({
                    updateInfo,
                    setUpdateInfo,
                    refetch,
                    queryClient,
                  });
                  setEditing([]);
                }}
              />
              <DangerButtonComponent
                title={"Cancel"}
                size="sm"
                func={() => setEditing([])}
              />
            </div>
          );
        }

        // Both actions stay quiet until the row is hovered or keyboard-focused.
        // "Return" used to be a solid blue button on every single row, which
        // meant the page had ten primaries and therefore none.
        return (
          <div className="profile-row-actions">
            <span className="profile-row-actions__reveal">
              <GrayButtonComponent
                title={"Edit due date"}
                size="sm"
                ariaLabel={`Edit due date for ${record.device_serial_number}`}
                func={() => setEditing([record.device_id])}
              />
            </span>
            <span className="profile-row-actions__reveal">
              <GrayButtonComponent
                title={"Return"}
                size="sm"
                ariaLabel={`Return ${record.device_serial_number}`}
                func={() => {
                  setChecked(true);
                  setStoredRecord(record);
                }}
              />
            </span>
          </div>
        );
      },
    },
  ];
};
