import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";

const ExpandedRowTableButtons = ({
  record,
  handleReturnItemInTransaction,
  handleLostSingleDevice,
  handleReturnItemFromLeaseTransaction,
  ReverseRightArrow,
  LostIcon,
}) => {
  const propsLostSingleDevice = {
    ...record,
    new_status: "Lost",
  };

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "5px" }}>
      <BlueButtonComponent
        disabled={!record.status}
        icon={<img src={ReverseRightArrow} alt="ReverseRightArrow" />}
        title={
          record.transactionData.type === "lease"
            ? "Mark as ended lease"
            : "Mark as returned"
        }
        func={() =>
          record.transactionData.type === "lease"
            ? handleReturnItemFromLeaseTransaction(record)
            : handleReturnItemInTransaction(record)
        }
      />
      <GrayButtonComponent disabled={!record.status} title={"Mark as lost"} func={() => handleLostSingleDevice(propsLostSingleDevice)} icon={<img src={LostIcon} alt="LostIcon" />} />
    </div>
  );
};

export default ExpandedRowTableButtons;
