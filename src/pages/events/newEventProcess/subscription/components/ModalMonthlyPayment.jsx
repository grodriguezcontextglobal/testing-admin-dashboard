import { Modal } from "antd";
import { useState } from "react";
import { StripeCheckoutElementAdmin } from "../../../../../components/stripe/elements/StripeCheckoutElementAdmin";

const ModalMonthlyPayment = ({ clientSecret, setClientSecret, total }) => {
  const [openModal, setOpenModal] = useState(
    `${clientSecret?.length > 0}`
  );
  const closeModal = () => {
    setOpenModal(false);
    setClientSecret(null)
  };
  return (
    <Modal
      title="Monthly payment method"
      centered
      open={openModal}
      onOk={() => closeModal()}
      onCancel={() => closeModal()}
      footer={[]}
    >
      <StripeCheckoutElementAdmin clientSecret={clientSecret} total={total} />
    </Modal>
  );
};
export default ModalMonthlyPayment;
