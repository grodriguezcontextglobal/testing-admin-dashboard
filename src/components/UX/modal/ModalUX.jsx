import { Modal } from "antd";

const ModalUX = ({
  title = null,
  body,
  openDialog,
  closeModal,
  onClose = null,
  width = 1000,
  footer = null,
  modalStyles = {},
}) => {
  return (
    <Modal
      open={openDialog}
      onClose={() => closeModal()}
      onCancel={() => closeModal()}
      onOk={onClose}
      centered
      width={width}
      footer={footer}
      maskClosable={false}
      title={title}
      style={modalStyles}
    >
      {body}
    </Modal>
  );
};

export default ModalUX;
