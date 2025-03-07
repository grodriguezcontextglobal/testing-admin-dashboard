import { Button } from "antd";
import { DangerButton } from "../../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../../styles/global/DangerButtonText";
import { GrayButton } from "../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../styles/global/GrayButtonText";

const ExpandedLostButton = ({ record, handleLostSingleDevice, Lost }) => {
  return (
    <div style={{ display: "flex", gap: "5px" }}>
      <Button
        disabled
        style={{ ...DangerButton, alignItems: "center" }}
      >
        <img src={Lost} alt="Lost" />
        <p
          style={{
            ...DangerButtonText,
            alignSelf: "center",
          }}
        >
          Charge customer
        </p>
      </Button>
      <Button
        disabled={!record.status || typeof record.status === "string"}
        onClick={() => handleLostSingleDevice(record)}
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
          Mark as found
        </p>
      </Button>
    </div>
  );
};

export default ExpandedLostButton;
