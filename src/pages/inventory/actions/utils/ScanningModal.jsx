import { Chip, OutlinedInput, Typography } from "@mui/material";
import { Button, Modal, Space } from "antd";
import { useForm } from "react-hook-form";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../styles/global/Subtitle";
import { useRef } from "react";

const ScanningModal = ({
  openScanningModal,
  setOpenScanningModal,
  scannedSerialNumbers,
  setScannedSerialNumbers,
}) => {
  const { register, handleSubmit, setValue } = useForm();
  const ref = useRef(null);
  const closeModal = () => {
    setOpenScanningModal(false);
  };
  const handleAddDevices = (data) => {
    const result = [...scannedSerialNumbers, data.serialNumber];
    setValue("serialNumber", "");
    return setScannedSerialNumbers(result);
  };

  const removeItemFromSelectedItems = (props) => {
    const result = scannedSerialNumbers.filter((_, i) => i !== props);
    return setScannedSerialNumbers(result);
  };

  const renderingTitle = () => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          textTransform={"none"}
          style={{ ...Subtitle, textWrap: "balance" }}
          padding={"1rem 0"}
        >
          Scanning all serial numbers here
        </Typography>
        <Typography
          textTransform={"none"}
          style={{ ...Subtitle, textWrap: "balance" }}
          padding={"1rem 0"}
        >
          Total scanned: {scannedSerialNumbers.length}
        </Typography>
      </div>
    );
  };
  return (
    <Modal
      title={renderingTitle()}
      open={openScanningModal}
      onOk={() => closeModal()}
      onCancel={() => closeModal()}
      footer={[
        <Button key="done_button" style={{ ...BlueButton, width: "100%" }} onClick={closeModal}>
          <p style={BlueButtonText}>Done</p>
        </Button>,
      ]}
      centered
      maskClosable={false}
    >
      <form
        style={{
          display: "flex",
          gap: "20px",
          justifyContent: "flex-start",
          alignItems: "center",
          width: "100%",
          margin: "1rem auto",
        }}
        onSubmit={handleSubmit(handleAddDevices)}
      >
        <OutlinedInput
          autoFocus={true}
          ref={ref}
          {...register("serialNumber")}
          style={OutlinedInputStyle}
          placeholder="Scan serial number to check in."
          fullWidth
        />
        <Button style={{ ...BlueButton, width: "100%" }} htmlType="submit">
          <p style={BlueButtonText}>Add</p>
        </Button>
      </form>
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
          {scannedSerialNumbers.map((item, index) => (
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

export default ScanningModal;
