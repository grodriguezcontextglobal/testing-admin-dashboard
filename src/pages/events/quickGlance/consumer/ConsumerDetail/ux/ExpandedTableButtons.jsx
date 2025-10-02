import { Space } from "antd";
import DangerButtonConfirmationComponent from "../../../../../../components/UX/buttons/DangerButtonConfirmation";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../../../../components/UX/buttons/DangerButton";

const ExpandedTableButtons = ({
  record,
  handleAssignSingleDevice,
  handleReturnSingleDevice,
  statusRecordState,
  handleRecord,
  handleLostSingleDevice,
  user,
  event,
  dispatch,
  rowRecord,
  onTriggerModalToReplaceReceiver,
  onReceiverObjectToReplace,
}) => {
  return (
    <div style={{ width: "100%" }}>
      <Space size="middle">
        {record.status === "Lost" || record.status === false ? (
          <BlueButtonComponent
            func={() => handleAssignSingleDevice(record)}
            title="Assign"
            disabled={String(record.status).toLowerCase() === "lost"}
            loading={record.key === statusRecordState}
            styles={{
              width: "fit-content",
              border: `${
                String(record.status).toLowerCase() === "lost"
                  ? "1px solid var(--disabled-blue-button)"
                  : "1px solid var(--blue-dark-600, #155EEF)"
              }`,
              backgroundColor: `${
                String(record.status).toLowerCase() === "lost"
                  ? "var(--disabled-blue-button)"
                  : "var(--blue-dark-600, #155EEF)"
              }`,
            }}
          />
        ) : (
          <DangerButtonComponent
            title={"Return"}
            func={() => handleReturnSingleDevice(record)}
            disabled={!event.active}
            loadingState={record.key === statusRecordState}
          />
        )}
        {record.status === true && (
          <BlueButtonComponent
            title={"Replace"}
            func={() => {
              dispatch(onTriggerModalToReplaceReceiver(true));
              dispatch(onReceiverObjectToReplace(record));
              handleRecord(rowRecord);
            }}
            disabled={!event.active}
            styles={{ width: "fit-content" }}
          />
        )}
        {record.status === true &&
          event.staff.adminUser.some(
            (element) => element.email === user.email
          ) && (
            <DangerButtonConfirmationComponent
              confirmationTitle="Are you sure you want to return all items of this transaction?"
              func={() => handleLostSingleDevice(record)}
              title={"Lost"}
            />
          )}
      </Space>
    </div>
  );
};

export default ExpandedTableButtons;
