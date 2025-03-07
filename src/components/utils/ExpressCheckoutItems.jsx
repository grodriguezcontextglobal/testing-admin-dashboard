import { useQueryClient } from "@tanstack/react-query";
import { Button, message, Modal, notification, Popconfirm, Space } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { TextFontSize30LineHeight38 } from "../../styles/global/TextFontSize30LineHeight38";
import { devitrakApi } from "../../api/devitrakApi";
import { Chip, OutlinedInput } from "@mui/material";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import { BlueButton } from "../../styles/global/BlueButton";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import { PropTypes } from "prop-types";

const ExpressCheckoutItems = ({
  openReturnDeviceBulkModal,
  setOpenReturnDeviceInBulkModal,
  event,
  user,
  refetching = null,
  selectedItems,
  setSelectedItems,
  emailNotification,
}) => {
  const { register, handleSubmit, setValue } = useForm();
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [scannedDevice, setScannedDevice] = useState([]);
  const queryClient = useQueryClient();
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
    queryClient.invalidateQueries("assginedDeviceList", { exact: true });
  };

  const returnDeviceInPool = async () => {
    const template = {
      device: scannedDevice,
      company: user.companyData.id,
      activity: false,
      eventSelected: event.eventInfoDetail.eventName,
    };

    await devitrakApi.patch(`/receiver/update-bulk-items-in-pool`, template);

    queryClient.invalidateQueries({
      queryKey: ["assginedDeviceList"],
      exact: true,
    });

    queryClient.invalidateQueries({
      queryKey: ["listOfreceiverInPool"],
      exact: true,
    });

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
      await queryClient.invalidateQueries("assginedDeviceList", {
        exact: true,
      });
      queryClient.invalidateQueries("allConsumersBasedOnEventsPerCompany", {
        exact: true,
      });  
      refetching !== null && refetching();
      setLoadingStatus(false);
      await emailNotification();
      openNotificationWithIcon("Success", "All devices returned!");
      message.success("All devices returned!");
      await devitrakApi.post("/cache_update/remove-cache", {
        key: `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`,
      });
      await devitrakApi.post("/cache_update/remove-cache", {
        key: `eventSelected=${event.id}&company=${user.companyData.id}`,
      });

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

  return (
    <Modal
      open={openReturnDeviceBulkModal}
      title={renderingTitle()}
      onOk={() => closeModal()}
      onCancel={() => closeModal()}
      footer={[]}
      maskClosable={false}
      width={1000}
      style={{ zIndex: 30 }}
    >
      {contextHolder}
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
    </Modal>
  );
};

export default ExpressCheckoutItems;

ExpressCheckoutItems.propTypes = {
  openReturnDeviceBulkModal: PropTypes.bool,
  setOpenReturnDeviceInBulkModal: PropTypes.bool,
  record: PropTypes.object,
  refetching: PropTypes.func,
};
