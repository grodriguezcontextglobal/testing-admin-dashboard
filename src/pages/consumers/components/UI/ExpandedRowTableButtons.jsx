import { Button } from "antd";
import GrayButtonText from "../../../../styles/global/GrayButtonText";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../../styles/global/GrayButton";
import { useMediaQuery } from "@uidotdev/usehooks";

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
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );

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
            <img src={ReverseRightArrow} alt="ReverseRightArrow" />
            <span
              style={{
                display: isSmallDevice || isMediumDevice ? "none" : "flex",
              }}
            >
              &nbsp;Mark as returned
            </span>
          </p>
        )}
      </Button>
      <Button
        disabled={!record.status}
        onClick={() => handleLostSingleDevice(propsLostSingleDevice)}
        style={{
          ...GrayButton,
          background:
            isSmallDevice || isMediumDevice
              ? "var(--gray900)"
              : GrayButton.background,
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
          <img
            src={LostIcon}
            alt="LostIcon"
            style={{
              display: isSmallDevice || isMediumDevice ? "flex" : "none",
            }}
          />
          <span
            style={{
              display: isSmallDevice || isMediumDevice ? "none" : "flex",
            }}
          >
            Mark as lost
          </span>
        </p>
      </Button>
    </div>
  );
};

export default ExpandedRowTableButtons;
