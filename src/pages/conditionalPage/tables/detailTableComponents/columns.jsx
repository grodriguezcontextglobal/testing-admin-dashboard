import DatePicker from "react-datepicker";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import { updateExpectedReturnDate } from "./acions/EditRowInformation";
import DangerButtonComponent from "../../../../components/UX/buttons/DangerButton";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import "./style.css"
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
      title: "Serial Number",
      dataIndex: "device_serial_number",
      key: "device_serial_number",
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
      title: "Assigned Date",
      dataIndex: "assigned_date",
      key: "assigned_date",
    },
    {
      title: "Expected Return Date",
      dataIndex: "expected_return_date",
      key: "expected_return_date",
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
        return value;
      },
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => {
        return (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 8,
            }}
          >
            {editing.length > 0 &&
            editing.every((item) => item === record.device_id) ? (
              <div style={{ width: "100%", display: "flex", flex: 2, gap: 8 }}>
                <GrayButtonComponent
                  title={"Update"}
                  func={async () => {
                    await updateExpectedReturnDate({
                      updateInfo,
                      setUpdateInfo,
                      refetch,
                      queryClient,
                    });
                    setEditing([]);
                  }}
                  styles={{ flex: 1 }}
                />
                <DangerButtonComponent
                  title={"Cancel"}
                  func={() => setEditing([])}
                  styles={{ flex: 1 }}
                />
              </div>
            ) : (
              <GrayButtonComponent
                title={"Edit"}
                func={() => setEditing([record.device_id])}
              />
            )}
            {editing.length === 0 && (
              <BlueButtonComponent
                title={"Return"}
                func={() =>{ setChecked(true); setStoredRecord(record)}}
              />
            )}
          </div>
        );
      },
    },
  ];
};
