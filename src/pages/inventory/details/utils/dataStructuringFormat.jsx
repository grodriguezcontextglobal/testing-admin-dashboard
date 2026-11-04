import { groupBy, uniqueId } from "lodash";

/**
 * @param {Array} renderedListItems the listed items the table shows
 * @param {Object} groupingByDeviceType item images grouped by `item_group`
 * @param {Array|undefined} inventoryItems the inventory rows
 *   (`warehouse-items` → `data.items`), not the query object, so a caller's
 *   memo can depend on the rows alone
 */
export const dataStructuringFormat = (
  renderedListItems,
  groupingByDeviceType,
  inventoryItems
) => {
  const resultFormatToDisplay = new Set();
  const groupingBySerialNumber = groupBy(inventoryItems, "serial_number");
  if (renderedListItems?.length > 0) {
    for (let data of renderedListItems) {
      if (groupingBySerialNumber[data.serial_number]) {
        resultFormatToDisplay.add({
          key: `${data.item_id}-${uniqueId()}`,
          item_id: data.item_id,
          ...data,
          data: {
            ...data,
            location:
              groupingBySerialNumber[data.serial_number]?.at(-1).location,
            ...groupingBySerialNumber[data.serial_number]?.at(-1),
          },
          location: groupingBySerialNumber[data.serial_number]?.at(-1).location,
          image_url:
            groupingBySerialNumber[data.serial_number]?.at(-1).image_url ??
            groupingByDeviceType[data.item_group]?.at(-1).image_url,
        });
      }
    }
    return Array.from(resultFormatToDisplay);
  }
  return [];
};

export const dataToDisplay = (dataStructuringFormat, searchItem) => {
  if (!searchItem || searchItem === "") {
    // &&(searchParameter === "undefined" || searchParameter === "")
    if (dataStructuringFormat.length > 0) {
      return dataStructuringFormat;
    }
    return [];
  } else if (String(searchItem).length > 0) {
    return dataStructuringFormat?.filter((item) =>
      JSON.stringify(item)
        .toLowerCase()
        .includes(String(searchItem).toLowerCase())
    );
  }
  return [];
};

/* One dictionary for the whole app, in ownershipUtils. This one said "For
   sale" while the filters said "For resale" and the export said "For Resale" —
   three names for one value on three screens. */
export { OWNERSHIP_LABELS as dictionary } from "../../actions/utils/ownershipUtils";
export const cellStyle = {
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
};
