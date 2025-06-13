import { devitrakApi } from "../../api/devitrakApi";
import clearCacheMemory from "../../utils/actions/clearCacheMemory";

const handleReturnSingleDevice = async (props) => {
  const {
    user, //user
    serialNumber, //rowRecord.serialNumber
    deviceType, //rowRecord.deviceType
    deviceData, //receiver information (receiver in transaction) - /receiver/receiver-assigned-list
    event, //event information
    customer, //customer information
    status, //device status to assign (false or Lost)
  } = props;
  try {
    const deviceInPoolListQuery = await devitrakApi.post(
      "/receiver/receiver-pool-list",
      {
        eventSelected: event.eventInfoDetail.eventName,
        company: user.companyData.id,
        device: serialNumber,
        type: deviceType,
      }
    );
    let returnedItem = {
      ...deviceData.device,
      status: status,
    };
    const respUpdate = await devitrakApi.patch(
      `/receiver/receiver-update/${deviceData.id}`,
      {
        id: deviceData.id,
        device: returnedItem,
      }
    );
    if (respUpdate.data) {
      if (deviceInPoolListQuery.data.receiversInventory?.length > 0) {
        await clearCacheMemory(
          `event_id=${event.id}&company=${
            user.companyData.id
          }&consumerInfo.id=${customer.id ?? customer.uid}`
        );
        const checkInPool =
          deviceInPoolListQuery.data.receiversInventory.at(-1);
        const deviceInPoolProfile = {
          id: checkInPool.id,
          activity: false,
          status: typeof status === "string" ? status : checkInPool.status,
        };
        await devitrakApi.patch(
          `/receiver/receivers-pool-update/${deviceInPoolProfile.id}`,
          deviceInPoolProfile
        );
      }
    }
    await clearCacheMemory(
      `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`
    );
    await clearCacheMemory(
      `eventSelected=${event.id}&company=${user.companyData.id}`
    );
  } catch (error) {
    return null;
  }
};

export default handleReturnSingleDevice;

// const linkStructure = `https://app.devitrak.net/authentication/${event.id}/${user.companyData.id}/${customer.uid}`;
// const emailStructure = new EmailStructureUpdateItem(
//   customer.name,
//   customer.lastName,
//   customer.email,
//   returnedItem.serialNumber,
//   returnedItem.deviceType,
//   event.eventInfoDetail.eventName,
//   event.company,
//   rowRecord.paymentIntent,
//   String(dateRef.slice(0, 4)).replaceAll(",", " "),
//   dateRef[4],
//   linkStructure
// );
// await devitrakApi.post(
//   "/nodemailer/confirm-returned-device-notification",
//   emailStructure.render()
// );
