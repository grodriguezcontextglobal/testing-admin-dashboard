import { Modal } from "antd";
import { useState } from "react";
import { PropTypes } from "prop-types";
import { CheckoutElementCompanySubscription } from "../../../components/stripe/elements/CheckoutElementCompanySubscription";
const ModalPayment = ({
  clientSecret,
  setClientSecret,
  total,
  title,
  type,
}) => {
  const [openModal, setOpenModal] = useState(`${clientSecret.length}`);
  const closeModal = () => {
    setOpenModal(false);
    setClientSecret(null);
  };
  return (
    <Modal
      title={title}
      centered
      open={openModal}
      onOk={() => closeModal()}
      onCancel={() => closeModal()}
      footer={[]}
    >
      <CheckoutElementCompanySubscription
        clientSecret={clientSecret}
        total={total}
        type={type}
      />
    </Modal>
  );
};

export default ModalPayment;

ModalPayment.propTypes = {
  clientSecret: PropTypes.string,
  setClientSecret: PropTypes.func,
  total: PropTypes.string,
  title: PropTypes.string,
  type: PropTypes.string,
};
