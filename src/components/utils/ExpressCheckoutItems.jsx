import { Chip, OutlinedInput } from "@mui/material";
import { Button, message, notification, Popconfirm, Space } from "antd";
import { PropTypes } from "prop-types";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { devitrakApi } from "../../api/devitrakApi";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import { TextFontSize30LineHeight38 } from "../../styles/global/TextFontSize30LineHeight38";
import clearCacheMemory from "../../utils/actions/clearCacheMemory";
import ModalUX from "../UX/modal/ModalUX";

const ExpressCheckoutItems = ({
  openReturnDeviceBulkModal,
  setOpenReturnDeviceInBulkModal,
  event,
  user,
  refetchingDevicePerTransaction,
  selectedItems,
  setSelectedItems,
}) => {
  const { register, handleSubmit, setValue } = useForm();
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [scannedDevice, setScannedDevice] = useState([]);
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg) => {
    api.open({
      message: msg,
    });
  };
  const closeModal = () => {
    setOpenReturnDeviceInBulkModal(false);
  };

  const renderingTitle = () => {
    return (
      <p
        style={{
          ...TextFontSize30LineHeight38,
          textWrap: "balance",
          textTransform: "none",
          padding: "1rem 1.5rem",
        }}
      >
        Please review and confirm the items you want to return.
      </p>
    );
  };

  const returnDevicesInTransaction = async () => {
    const template = {
      timeStamp: new Date().getTime(),
      device: scannedDevice,
    };
    await devitrakApi.patch(
      `/receiver/update-bulk-items-in-transaction`,
      template
    );
  };

  const returnDeviceInPool = async () => {
    const template = {
      device: scannedDevice,
      company: user.companyData.id,
      activity: false,
      eventSelected: event.eventInfoDetail.eventName,
    };

    await devitrakApi.patch(`/receiver/update-bulk-items-in-pool`, template);
    return null;
  };

  const removeItemFromSelectedItems = (props) => {
    const result = scannedDevice.filter((_, i) => i !== props);
    return setScannedDevice(result);
  };

  const handleReturnDevices = async (e) => {
    e.preventDefault();
    try {
      setLoadingStatus(true);
      await returnDevicesInTransaction();
      await returnDeviceInPool();
      setLoadingStatus(false);
      openNotificationWithIcon("Success", "All devices returned!");
      refetchingDevicePerTransaction();
      message.success("All devices returned!");
      await clearCacheMemory(
        `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`
      );
      await clearCacheMemory(
        `eventSelected=${event.id}&company=${user.companyData.id}`
      );

      setSelectedItems([]);
      return closeModal();
    } catch (error) {
      setLoadingStatus(false);
      message.error(`There was an error. ${error}`);
    }
  };

  const handleAddDevices = async (data) => {
    try {
      let resultToReturn = new Map();
      let scanned = [];
      const add = selectedItems.filter(
        (element) => element.serialNumber === data.serialNumber
      );
      if (
        add.length > 0 &&
        !scannedDevice.some((element) => element.key === add[0].key)
      ) {
        resultToReturn.set(add[0].key, add[0]);
      } else {
        return message.warning(
          "Serial number is not in use or already scanned or invalid for this transaction."
        );
      }
      // eslint-disable-next-line no-unused-vars
      for (let [_, value] of resultToReturn) {
        scanned.push(value);
      }
      setValue("serialNumber", "");
      return setScannedDevice([...scannedDevice, ...scanned]);
    } catch {
      return message.error("Something went wrong, please try later.");
    }
  };

  const body = () => {
    return (
      <>
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
            {scannedDevice.map((item, index) => (
              <Chip
                key={item.key}
                label={item.serialNumber}
                onDelete={() => removeItemFromSelectedItems(index)}
              />
            ))}
          </Space>
          <Popconfirm
            title="Are you sure you want to return all scanned devices?"
            onConfirm={(e) => handleReturnDevices(e)}
          >
            <Button
              style={{ ...BlueButton, width: "100%" }}
              loading={loadingStatus}
            >
              <p style={BlueButtonText}>
                Confirm return | Total items to return: {scannedDevice.length}
              </p>
            </Button>
          </Popconfirm>
        </div>
      </>
    );
  };

  return (
    <>
      {contextHolder}
      <ModalUX
        openDialog={openReturnDeviceBulkModal}
        closeModal={closeModal}
        body={body()}
        width={1000}
        title={renderingTitle()}
      />
    </>
  );
};

export default ExpressCheckoutItems;

ExpressCheckoutItems.propTypes = {
  openReturnDeviceBulkModal: PropTypes.bool,
  setOpenReturnDeviceInBulkModal: PropTypes.bool,
  record: PropTypes.object,
  refetching: PropTypes.func,
};
