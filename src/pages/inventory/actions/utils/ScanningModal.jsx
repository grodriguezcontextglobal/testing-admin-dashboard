import { OutlinedInput, Typography } from "@mui/material";
import { Modal, Space } from "antd";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import Chip from "../../../../components/UX/Chip/Chip";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../styles/global/Subtitle";

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
    if(data.serialNumber.length < 1) return;
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
          Scanning/typing all serial numbers here
        </Typography>
        <Typography
          textTransform={"none"}
          style={{ ...Subtitle, textWrap: "balance" }}
          padding={"1rem 0"}
        >
          Total scanned/typed: {scannedSerialNumbers.length}
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
        <BlueButtonComponent key="done_button" title="Done" buttonType="button" styles={{ width: "100%" }} func={closeModal} />,
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
          {...register("serialNumber", { minLength: 1, required: true })}
          style={OutlinedInputStyle}
          placeholder="Scan/type serial number to check in."
          fullWidth
        />
        <BlueButtonComponent title="Add" buttonType="submit" styles={{ width: "fit-content" }} />
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
