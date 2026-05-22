import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";

const ExpandedRowTableButtons = ({
  record,
  handleReturnItemInTransaction,
  handleLostSingleDevice,
  handleReturnItemFromLeaseTransaction,
  // ReverseRightArrow,
  // LostIcon,
}) => {
  const propsLostSingleDevice = {
    ...record,
    new_status: "Lost",
  };

  const returnButtonTitle = () => {
    return record.status ? (
      record.transactionData.type === "lease"
        ? "Mark as ended lease"
        : "Mark as returned"
    ) : (
      record.transactionData.type === "lease"
        ? "Lease device returned"
        : "Device returned"
    )
  }
  const lostButtonTitle = () => {
    return record.status !== "lost" ?
      "Mark as lost"
      :
      "Marked as lost "
  }
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "5px" }}>
      <BlueButtonComponent
        title={returnButtonTitle()}
        func={() =>
          record.transactionData.type === "lease"
            ? handleReturnItemFromLeaseTransaction(record)
            : handleReturnItemInTransaction(record)
        }
      />
      {record.status &&
        <GrayButtonComponent title={lostButtonTitle()} func={() => handleLostSingleDevice(propsLostSingleDevice)} />
      }
    </div>
  );
};

export default ExpandedRowTableButtons;
