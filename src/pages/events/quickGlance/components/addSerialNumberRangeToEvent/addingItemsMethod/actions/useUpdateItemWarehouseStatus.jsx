import { paramsFetched } from "./useInsertDeviceIntoEventTableRecord";

const updateItemWarehouseStatus = async ({ serials, companyId }) => {
  // Guard against empty input to avoid invalid SQL like IN ()
  if (!Array.isArray(serials) || serials.length === 0 || !companyId) {
    return [];
  }

  const placeholder = serials.map(() => "?").join(",");
  const query =
    `SELECT item_id, brand, item_group, category_name, container, container_items, descript_item, serial_number ` +
    `FROM item_inv WHERE serial_number IN (${placeholder}) AND company_id = ?`;
  const values = [...serials, companyId];
  const itemsData = await paramsFetched({
    query,
    values,
  });
  // paramsFetched already returns the array result
  return itemsData;
};

export default updateItemWarehouseStatus;
