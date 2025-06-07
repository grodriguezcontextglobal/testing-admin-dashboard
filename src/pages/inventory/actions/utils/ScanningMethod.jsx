import { Chip } from "@mui/material";
import { Modal, Space } from "antd";

const ScanningMethod = ({ openScannedItemView, setOpenScannedItemView , scannedDevice, setScannedDevice }) => {

  const removeItemFromSelectedItems = (index) => {
    const newSelectedItems = scannedDevice.filter((_, i) => i !== index);
    return setScannedDevice(newSelectedItems);
  };

  const closeModal = () => {
    setOpenScannedItemView(false);
  };
  return (
    <Modal
      open={openScannedItemView}
      title="All items"
      onOk={closeModal}
      onCancel={closeModal}
      footer={null}
      centered
      maskClosable={false}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Space size={[8, 16]} wrap>
          {scannedDevice.map((item, index) => (
            <Chip
              key={item}
              label={item}
              onDelete={() => removeItemFromSelectedItems(index)}
            />
          ))}
        </Space>
      </div>
    </Modal>
  );
};

export default ScanningMethod;
