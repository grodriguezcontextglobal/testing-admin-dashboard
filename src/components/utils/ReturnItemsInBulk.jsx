import { message } from "antd";
import { devitrakApi } from "../../api/devitrakApi";
import clearCacheMemory from "../../utils/actions/clearCacheMemory";

const returningItemsInBulkMethod = ({
  user,
  event,
  selectedItems,
  setSelectedItems,
}) => {

  const returnDevicesInTransaction = async () => {
    const template = {
      timeStamp: new Date().getTime(),
      device: selectedItems,
      // Fix: Use serialNumber as the key since it's available and should be unique
      key: selectedItems.map(item => item.serialNumber).filter(Boolean)
    };
   await devitrakApi.patch(
      `/receiver/update-bulk-items-in-transaction`,
      template
    );
    return null;
  };

  const returnDeviceInPool = async () => {
    const template = {
      device: selectedItems,
      company: user.companyData.id,
      activity: false,
      eventSelected: event.eventInfoDetail.eventName,
      // // Also add key here if needed by the API
      // key: selectedItems.map(item => item.serialNumber).filter(Boolean)
    };

    await devitrakApi.patch(
      `/receiver/update-bulk-items-in-pool`,
      template
    );
    return null;
  };

  const handleReturnDevices = async () => {
    try {
      await returnDevicesInTransaction();
      await returnDeviceInPool();
      message.success("All devices returned!");
      await clearCacheMemory(
        `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`
      );
      await clearCacheMemory(
        `eventSelected=${event.id}&company=${user.companyData.id}`
      );
      setSelectedItems([]);
      return null;
    } catch (error) {
      message.error(`There was an error. ${error}`);
    }
  };
  return handleReturnDevices();
};

export default returningItemsInBulkMethod;
