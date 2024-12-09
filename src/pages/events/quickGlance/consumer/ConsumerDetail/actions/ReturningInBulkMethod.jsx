import { Chip, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Button, message, Modal, notification, Space } from "antd";
import { PropTypes } from "prop-types";
import { useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import { TextFontSize30LineHeight38 } from "../../../../../../styles/global/TextFontSize30LineHeight38";
import { BlueButton } from "../../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../../styles/global/BlueButtonText";
const ReturningInBulkMethod = ({
  openReturnDeviceBulkModal,
  setOpenReturnDeviceInBulkModal,
  record,
  refetching,
  selectedItems,
  setSelectedItems,
}) => {
  const { user } = useSelector((state) => state.admin);
  const [loadingStatus, setLoadingStatus] = useState(false);
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
      <Typography
        textTransform={"none"}
        style={{ ...TextFontSize30LineHeight38, textWrap: "balance" }}
        padding={"1rem 1.5rem"}
      >
        Please review and confirm the items you want to return.
      </Typography>
    );
  };

  const returnDevicesInTransaction = async () => {
    const template = {
      timeStamp: new Date().getTime(),
      device: selectedItems,
    };
    await devitrakApi.patch(`/receiver/update-bulk-items-in-transaction`, template);
    queryClient.invalidateQueries("assginedDeviceList", { exact: true });
  };

  const returnDeviceInPool = async () => {
    const template = {
      device: selectedItems,
      company: user.companyData.id,
      activity: false,
      eventSelected: record.eventSelected,
    };
    
    await devitrakApi.patch(
      `/receiver/update-bulk-items-in-pool`,
      template
    );

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
    const result = selectedItems.filter((_, i) => i !== props);
    return setSelectedItems(result);
  };

  const handleReturnDevices = async (e) => {
    e.preventDefault();
    try {
      setLoadingStatus(true);
      await returnDevicesInTransaction()
      await returnDeviceInPool()
      await queryClient.invalidateQueries("assginedDeviceList", {
        exact: true,
      });
      refetching();
      setLoadingStatus(false);
      openNotificationWithIcon("Success", "All devices returned!");
      message.success("All devices returned!");
      setSelectedItems([]);
      return closeModal();
    } catch (error) {
      setLoadingStatus(false);
      message.error(`There was an error. ${error}`);
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
          {selectedItems.map((item, index) => (
            <Chip key={item.id} label={item.serialNumber} onDelete={() => removeItemFromSelectedItems(index)} />
          ))}
        </Space>
        <Button
          style={{ ...BlueButton, width: "100%" }}
          loading={loadingStatus}
          onClick={(e) => handleReturnDevices(e)}
        >
          <p style={BlueButtonText}>
            Confirm return | Total items to return: {selectedItems.length}
          </p>
        </Button>
      </div>
    </Modal>
  );
};

export default ReturningInBulkMethod;

ReturningInBulkMethod.propTypes = {
  openReturnDeviceBulkModal: PropTypes.bool,
  setOpenReturnDeviceInBulkModal: PropTypes.bool,
  record: PropTypes.object,
  refetching: PropTypes.func,
};
