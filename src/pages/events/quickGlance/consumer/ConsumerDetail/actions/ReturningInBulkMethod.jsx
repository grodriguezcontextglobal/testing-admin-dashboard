import { Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { message, Modal, notification, Space } from "antd";
import { PropTypes } from "prop-types";
import { useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import Chip from "../../../../../../components/UX/Chip/Chip";
import { TextFontSize30LineHeight38 } from "../../../../../../styles/global/TextFontSize30LineHeight38";
import clearCacheMemory from "../../../../../../utils/actions/clearCacheMemory";
const ReturningInBulkMethod = ({
  openReturnDeviceBulkModal,
  setOpenReturnDeviceInBulkModal,
  record,
  refetching,
  selectedItems,
  setSelectedItems,
  emailNotification,
}) => {
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
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
    await devitrakApi.patch(
      `/receiver/update-bulk-items-in-transaction`,
      template,
    );
    queryClient.invalidateQueries("assginedDeviceList", { exact: true });
  };

  const returnDeviceInPool = async () => {
    const template = {
      device: selectedItems,
      company: user.companyData.id,
      activity: false,
      eventSelected: record.eventSelected,
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
    const result = selectedItems.filter((_, i) => i !== props);
    return setSelectedItems(result);
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
      refetching();
      setLoadingStatus(false);
      await emailNotification();
      openNotificationWithIcon("Success", "All devices returned!");
      message.success("All devices returned!");
      await clearCacheMemory(
        `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`,
      );
      await clearCacheMemory(
        `eventSelected=${event.id}&company=${user.companyData.id}`,
      );
      await clearCacheMemory(
        `eventSelected=${event.eventInfoDetail.id}&company=${user.companyData.id}`,
      );
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
            <Chip
              key={item.id}
              label={item.serialNumber}
              onDelete={() => removeItemFromSelectedItems(index)}
              variant="filled"
              variantColor="blue"
            />
          ))}
        </Space>
        <BlueButtonComponent
          loadingState={loadingStatus}
          buttonType="submit"
          title={"Confirm return"}
          func={(e) => handleReturnDevices(e)}
        />
        {/* <Button
          style={{ ...BlueButton, width: "100%" }}
          loading={loadingStatus}
          onClick={(e) => handleReturnDevices(e)}
        >
          <p style={BlueButtonText}>
            Confirm return | Total items to return: {selectedItems.length}
          </p>
        </Button> */}
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
