import { Button } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ModalUX from "../../../../components/UX/modal/ModalUX";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { DangerButton } from "../../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../../styles/global/DangerButtonText";
import { GrayButton } from "../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../styles/global/GrayButtonText";

const ChargeOptionsModal = ({
  openChargeAllLostDevicesModal,
  setOpenChargeAllLostDevicesModal,
}) => {
  const { customer } = useSelector((state) => state.customer);
  const closeModal = () => {
    return setOpenChargeAllLostDevicesModal(false);
  };

  const navigate = useNavigate();
  return (
    <ModalUX
      openDialog={openChargeAllLostDevicesModal}
      closeModal={closeModal}
      body={null}
      footer={[
        <Button
          key="cancel"
          type="reset"
          onClick={closeModal}
          style={DangerButton}
        >
          <p style={DangerButtonText}>Cancel</p>
        </Button>,
        <Button
          key="back"
          type="button"
          onClick={() =>
            navigate(`/consumers/${customer.uid}/charge-all-lost-devices/cash`)
          }
          style={GrayButton}
        >
          <p style={GrayButtonText}>Cash</p>
        </Button>,
        <Button
          key="submit"
          type="button"
          onClick={() =>
            navigate(
              `/consumers/${customer.uid}/charge-all-lost-devices/credit_card`
            )
          }
          style={BlueButton}
        >
          <p style={BlueButtonText}>Credit card</p>
        </Button>,
      ]}
    />
    // <Modal
    //   open={openChargeAllLostDevicesModal}
    //   closable={false}
    //   centered
    //   footer={[
    //     <Button
    //       key="cancel"
    //       type="reset"
    //       onClick={closeModal}
    //       style={DangerButton}
    //     >
    //       <p style={DangerButtonText}>Cancel</p>
    //     </Button>,
    //     <Button
    //       key="back"
    //       type="button"
    //       onClick={() =>
    //         navigate(`/consumers/${customer.uid}/charge-all-lost-devices/cash`)
    //       }
    //       style={GrayButton}
    //     >
    //       <p style={GrayButtonText}>Cash</p>
    //     </Button>,
    //     <Button
    //       key="submit"
    //       type="button"
    //       onClick={() =>
    //         navigate(
    //           `/consumers/${customer.uid}/charge-all-lost-devices/credit_card`
    //         )
    //       }
    //       style={BlueButton}
    //     >
    //       <p style={BlueButtonText}>Credit card</p>
    //     </Button>,
    //   ]}
    //   styles={{
    //     footer: {
    //       display: "flex",
    //       justifyContent: "space-between",
    //       alignItems: "center",
    //       padding: "0 24px 12px",
    //       border: "none",
    //       width: "100%",
    //     },
    //   }}
    // ></Modal>
  );
};

export default ChargeOptionsModal;
