import { OutlinedInput, Typography } from "@mui/material";
import { Modal, Space, message } from "antd";
import { useForm } from "react-hook-form";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import Chip from "../../../../components/UX/Chip/Chip";
import { useScanInput, SCAN_REJECTED_DUPLICATE } from "../../../../hooks/useScanInput";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../styles/global/Subtitle";

const ScanningModal = ({
  openScanningModal,
  setOpenScanningModal,
  // Defaulted because this modal renders its own count: a caller that forgets
  // to pass the list should not take the screen down with it.
  scannedSerialNumbers = [],
  setScannedSerialNumbers = () => {},
}) => {
  const { register, handleSubmit, setValue } = useForm();
  const { inputRef, add, removeAt } = useScanInput({
    values: scannedSerialNumbers,
    setValues: setScannedSerialNumbers,
  });

  const closeModal = () => {
    setOpenScanningModal(false);
  };

  const handleAddDevices = (data) => {
    const outcome = add(data.serialNumber);
    // Clear either way: with a reader the next read is already on its way, and
    // leaving a rejected value behind would prepend it to that read.
    setValue("serialNumber", "");
    if (!outcome.ok && outcome.reason === SCAN_REJECTED_DUPLICATE) {
      message.warning(`${outcome.value} was already scanned.`);
    }
    return outcome;
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
          // inputRef (not ref) so focus lands on the <input> itself, which is
          // what lets consecutive reads chain without clicking back in.
          inputRef={inputRef}
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
              onDelete={() => removeAt(index)}
            />
          ))}
        </Space>
      </div>
    </Modal>
  );
};

export default ScanningModal;
