import { devitrakApi } from "../../../../../../../api/devitrakApi";

export const paramsFetched = async ({ query, values }) => {
  const itemsData = await devitrakApi.post(
    "/db_company/inventory-based-on-submitted-parameters",
    {
      query: query,
      values: values,
    }
  );
  return itemsData?.data?.result || [];
};
const insertDeviceIntoEventTableRecord = ({ data, event, deviceTitle }) => {
  // Guard: if no items, avoid running invalid UPDATE and bulk pool creation
  if (!Array.isArray(data) || data.length === 0) {
    return Promise.reject(
      new Error("No items to process for event insertion.")
    );
  }
  const placeholders = data.map(() => "?").join(", ");
  const updateWarehouseItemsValue = () =>
    paramsFetched({
      query: `UPDATE item_inv SET warehouse = ? WHERE item_id in (${placeholders})`,
      values: [1, ...data.map((item) => item.item_id)],
    });
  const createNoSQLDeviceInPoolEvent = async () => {
    const deviceList = JSON.stringify(data.map((item) => item.serial_number));
    const status = "Operational";
    const eventSelected = event.eventInfoDetail.eventName;
    const activity = false;
    const comment = "No comment";
    const provider = event.company;
    const type = deviceTitle;
    const company = event.company_id;
    return await devitrakApi.post("/receiver/receivers-pool-bulk", {
      deviceList: deviceList,
      status: status,
      eventSelected: eventSelected,
      activity: activity,
      comment: comment,
      provider: provider,
      type: type,
      company: company,
    });
  };
  const workflow = async () => {
    await updateWarehouseItemsValue();
    await createNoSQLDeviceInPoolEvent();
  };
  return workflow();
};

export default insertDeviceIntoEventTableRecord;
