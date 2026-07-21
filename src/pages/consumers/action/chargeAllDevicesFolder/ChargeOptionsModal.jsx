import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ModalUX from "../../../../components/UX/modal/ModalUX";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../../components/UX/buttons/DangerButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";

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
        <DangerButtonComponent key="cancel" buttonType="reset" onClick={closeModal}>
          Cancel
        </DangerButtonComponent>,
        <GrayButtonComponent
          key="back"
          onClick={() =>
            navigate(`/consumers/${customer.uid}/charge-all-lost-devices/cash`)
          }
        >
          Cash
        </GrayButtonComponent>,
        <BlueButtonComponent
          key="submit"
          onClick={() =>
            navigate(
              `/consumers/${customer.uid}/charge-all-lost-devices/credit_card`
            )
          }
        >
          Credit card
        </BlueButtonComponent>,
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
