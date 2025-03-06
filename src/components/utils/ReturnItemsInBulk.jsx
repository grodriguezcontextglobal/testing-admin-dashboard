import { message } from "antd";
import { devitrakApi } from "../../api/devitrakApi";

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
    };
    await devitrakApi.patch(
      `/receiver/update-bulk-items-in-transaction`,
      template
    );
  };

  const returnDeviceInPool = async () => {
    const template = {
      device: selectedItems,
      company: user.companyData.id,
      activity: false,
      eventSelected: event.eventInfoDetail.eventName,
    };

    await devitrakApi.patch(`/receiver/update-bulk-items-in-pool`, template);

    return null;
  };

  const handleReturnDevices = async () => {
    try {
      await returnDevicesInTransaction();
      await returnDeviceInPool();
      message.success("All devices returned!");
      await devitrakApi.post("/cache_update/remove-cache", {
        key: `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`,
      });
      await devitrakApi.post("/cache_update/remove-cache", {
        key: `eventSelected=${event.id}&company=${user.companyData.id}`,
      });

      setSelectedItems([]);
      return null;
    } catch (error) {
      message.error(`There was an error. ${error}`);
    }
  };
  return handleReturnDevices()
};

export default returningItemsInBulkMethod;
