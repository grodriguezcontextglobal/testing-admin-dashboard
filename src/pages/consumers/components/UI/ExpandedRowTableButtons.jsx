import { Button } from "antd";
import GrayButtonText from "../../../../styles/global/GrayButtonText";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../../styles/global/GrayButton";

const ExpandedRowTableButtons = ({
  record,
  handleReturnItemInTransaction,
  handleLostSingleDevice,
  handleReturnItemFromLeaseTransaction,
  ReverseRightArrow,
}) => {
  const propsLostSingleDevice = {
    ...record,
    new_status: "Lost",
  };
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "5px" }}>
      <Button
        disabled={!record.status}
        onClick={() =>
          record.transactionData.type === "lease"
            ? handleReturnItemFromLeaseTransaction(record)
            : handleReturnItemInTransaction(record)
        }
        style={{
          ...BlueButton,
          backgroundColor: record.status
            ? BlueButton.background
            : "var(--disabled-blue-button)",
          border: record.status
            ? BlueButton.border
            : "1px solid var(--disabled-blue-button)",
        }}
      >
        {record.transactionData.type === "lease" ? (
          <p
            style={{
              ...BlueButtonText,
              color: record.status ? BlueButtonText.color : "var(--gray200)",
            }}
          >
            Mark as ended lease
          </p>
        ) : (
          <p
            style={{
              ...BlueButtonText,
              color: record.status ? BlueButtonText.color : "var(--gray200)",
            }}
          >
            <img src={ReverseRightArrow} alt="ReverseRightArrow" /> &nbsp;Mark
            as returned
          </p>
        )}
      </Button>
      <Button
        disabled={!record.status}
        onClick={() => handleLostSingleDevice(propsLostSingleDevice)}
        style={{
          ...GrayButton,
        }}
      >
        <p
          style={{
            ...GrayButtonText,
            color: `${
              record.status
                ? GrayButtonText.color
                : "var(--disabled0gray-button-text)"
            }`,
          }}
        >
          Mark as lost
        </p>
      </Button>
    </div>
  );
};

export default ExpandedRowTableButtons;
