import { Button } from "antd";
import { DangerButton } from "../../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../../styles/global/DangerButtonText";
import { GrayButton } from "../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../styles/global/GrayButtonText";

const ExpandedLostButton = ({
  record,
  handleFoundSingleDevice,
  handleLostSingleDevice,
  Lost,
}) => {
  // const [chargeLostFeeModal, setChargeLostFeeModal] = useState(false);
  const propsUpdateSingleDevice = {
    ...record,
    new_status: true,
  }
  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "5px" }}>
        <Button onClick={() => handleLostSingleDevice(record)} style={{ ...DangerButton, alignItems: "center" }}>
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
          onClick={() => handleFoundSingleDevice(propsUpdateSingleDevice)}
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
      {/* {chargeLostFeeModal && (
        <ChargeLostFee
          openModal={chargeLostFeeModal}
          setOpenModal={setChargeLostFeeModal}
          record={record}
        />
      )} */}

    </>
  );
};

export default ExpandedLostButton;
