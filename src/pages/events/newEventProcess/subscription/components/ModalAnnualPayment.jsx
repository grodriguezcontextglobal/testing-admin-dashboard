import { Modal } from "antd";
import { useState } from "react";
import { StripeCheckoutElementAdmin } from "../../../../../components/stripe/elements/StripeCheckoutElementAdmin";

const ModalAnnualPayment = ({ clientSecret, setClientSecret, total }) => {
  const [openModal, setOpenModal] = useState(
    `${clientSecret.length}`
  );
  const closeModal = () => {
    setOpenModal(false);
    setClientSecret(null)
  };
  return (
    <Modal
      title="Annual payment method"
      style={{
        top: 20,
      }}
      open={openModal}
      onOk={() => closeModal()}
      onCancel={() => closeModal()}
      footer={[]}
    >
      <StripeCheckoutElementAdmin clientSecret={clientSecret} total={total} />
    </Modal>
  );
};

export default ModalAnnualPayment;
