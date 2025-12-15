import { Modal } from "antd";

const ModalUX = ({
  title = null,
  body,
  openDialog,
  closeModal,
  // onClose = null,
  // onOk = null,
  width = 1000,
  footer = [],
  modalStyles = {},
}) => {
  return (
    <Modal
      open={openDialog}
      onClose={() => closeModal()}
      onCancel={() => closeModal()}
      onOk={() => closeModal()}
      centered
      width={width}
      footer={footer}
      maskClosable={false}
      title={title}
      style={modalStyles}
      destroyOnHidden={true}
    >
      {body}
    </Modal>
  );
};

export default ModalUX;
