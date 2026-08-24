import { message, Space } from "antd";
import { PropTypes } from "prop-types";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { devitrakApi } from "../../api/devitrakApi";
import { BlueButton } from "../../styles/global/BlueButton";
import { TextFontSize30LineHeight38 } from "../../styles/global/TextFontSize30LineHeight38";
import clearCacheMemory from "../../utils/actions/clearCacheMemory";
import { cleanScanValue, findByScanValue } from "../../utils/scan/scanInput";
import Chip from "../UX/Chip/Chip";
import BlueButtonComponent from "../UX/buttons/BlueButton";
import BlueButtonConfirmationComponent from "../UX/buttons/BlueButtonConfirmation";
import Input from "../UX/inputs/Input";
import ModalUX from "../UX/modal/ModalUX";
import { useStatusNotification } from "../notification/alerts/useStatusNotification";

const ExpressCheckoutItems = ({
  openReturnDeviceBulkModal,
  setOpenReturnDeviceInBulkModal,
  event,
  user,
  refetchingDevicePerTransaction,
  selectedItems,
  setSelectedItems,
}) => {
  const { register, handleSubmit, setValue, setFocus } = useForm();
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [scannedDevice, setScannedDevice] = useState([]);
  const { notify, contextHolder } = useStatusNotification();
  const openNotificationWithIcon = (type, msg) => {
    notify(type.toLowerCase(), msg);
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
      const value = cleanScanValue(data.serialNumber);
      // Clear and refocus first: with a hardware reader the next read is already
      // on its way, and anything left behind gets prepended to it.
      setValue("serialNumber", "");
      setFocus("serialNumber");
      if (!value) return;

      const match = findByScanValue(selectedItems, value, {
        getValue: (item) => item.serialNumber,
      });
      // Split from the old combined warning: "not in this transaction" and
      // "already scanned" call for different reactions from the operator, and a
      // reader that re-reads a tag in range makes the second one routine.
      if (!match) {
        return message.warning(`${value} is not in this transaction.`);
      }
      if (scannedDevice.some((element) => element.key === match.key)) {
        return message.warning(`${value} was already scanned.`);
      }
      return setScannedDevice([...scannedDevice, match]);
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
          <Input
            {...register("serialNumber")}
            placeholder="Scan serial number to check in."
            fullWidth
          />
          <BlueButtonComponent title="Add" buttonType="submit" />
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
          <BlueButtonConfirmationComponent
            styles={{ ...BlueButton, width: "100%" }}
            loading={loadingStatus}
            title={`Confirm return | Total items to return: ${scannedDevice.length}`}
            confirmationTitle="Are you sure you want to return all scanned devices?"
            func={(e) => handleReturnDevices(e)}
          />
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
