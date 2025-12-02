import { message } from "antd";
import clearCacheMemory from "../../../../../../utils/actions/clearCacheMemory";

// Helper function to check if item already exists in event inventory
const checkIfItemExistsInEvent = (selectedItems, itemGroup) => {
  return selectedItems.some((element) => element.item_group === itemGroup);
};

// Helper function to update existing item quantity
const updateExistingItemQuantity = (
  selectedItems,
  setSelectedItem,
  dispatch,
  onAddDeviceSetup,
  itemGroup,
  additionalQuantity
) => {
  let updatedItems = [...selectedItems];
  let itemIndex = selectedItems.findIndex(
    (element) => element.item_group === itemGroup
  );
  if (itemIndex > -1) {
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      quantity:
        Number(updatedItems[itemIndex].quantity) + Number(additionalQuantity),
      isItSetAsContainerForEvent: false,
    };
    setSelectedItem([...updatedItems]);
    dispatch(onAddDeviceSetup(updatedItems));
    return true;
  }
  return false;
};

// Helper function to add new item to event inventory
const addNewItemToEvent = (
  selectedItems,
  setSelectedItem,
  dispatch,
  onAddDeviceSetup,
  newItem
) => {
  const updatedItems = [...selectedItems, newItem];
  setSelectedItem(updatedItems);
  dispatch(onAddDeviceSetup(updatedItems));
};

const finishingProcess = async ({
  setValue,
  openNotificationWithIcon,
  setLoadingStatus,
  user,
  template,
  eventItem,
}) => {
  // Reset form values
  setValue("category_name", "");
  setValue("item_group", "");
  setValue("cost", "");
  setValue("brand", "");
  setValue("descript_item", "");
  setValue("ownership", "");
  setValue("min_serial_number", "");
  setValue("max_serial_number", "");
  setValue("quantity", 0);
  setValue("location", "");
  setValue("tax_location", "");
  setValue("container", "");
  setValue("containerSpotLimit", "0");

  openNotificationWithIcon(
    "New group of items were created and added to event inventory."
  );
  setLoadingStatus(false);

  await clearCacheMemory(
    `company_id=${user.companyData.id}&warehouse=true&enableAssignFeature=1`
  );

  return { created: true, template, eventItem };
};
export const bulkItemInsertAlphanumericWithEventCheck = async ({
  data,
  user,
  openNotificationWithIcon,
  setLoadingStatus,
  setValue,
  img_url,
  moreInfo,
  formatDate,
  returningDate,
  subLocationsSubmitted,
  scannedSerialNumbers,
  setScannedSerialNumbers,
  alphaNumericInsertItemMutation,
  dicSuppliers,
  // New parameters for event inventory integration
  selectedItems = [],
  setSelectedItem,
  dispatch,
  onAddDeviceSetup,
  eventInfoDetail,
}) => {
  try {
    // Create new item in database
    const template = {
      category_name: data.category_name,
      item_group: data.item_group,
      cost: data.cost,
      brand: data.brand,
      descript_item: data.descript_item,
      ownership: data.ownership,
      list: scannedSerialNumbers,
      warehouse: true,
      main_warehouse: data.tax_location,
      created_at: formatDate(new Date()),
      update_at: formatDate(new Date()),
      company: user.company,
      location: data.location,
      current_location: data.location,
      sub_location: JSON.stringify(subLocationsSubmitted),
      extra_serial_number: JSON.stringify(moreInfo),
      company_id: user.sqlInfo.company_id,
      return_date: data.ownership === "Rent" ? formatDate(returningDate) : null,
      returnedRentedInfo: JSON.stringify([]),
      container: String(data.container).includes("Yes"),
      containerSpotLimit: data.containerSpotLimit,
      isItInContainer: JSON.stringify([]),
      containerId: JSON.stringify([]),
      display_item: 1,
      enableAssignFeature: data.enableAssignFeature === "YES" ? 1 : 0,
      image_url: img_url,
      existing: true,
      consumerUses: false,
      qty: data.quantity ?? data.qty,
      quantity: data.quantity ?? data.qty,
      supplier_info: data.supplier
        ? dicSuppliers.find(([key]) => key === data.supplier)[1]
        : null,
    };

    await alphaNumericInsertItemMutation.mutate(template);

    // Check if item already exists in event inventory
    const itemExists = checkIfItemExistsInEvent(selectedItems, data.item_group);

    if (itemExists) {
      // Update existing item quantity in event inventory
      const updated = updateExistingItemQuantity(
        selectedItems,
        setSelectedItem,
        dispatch,
        onAddDeviceSetup,
        data.item_group,
        data.quantity ?? data.qty
      );

      if (updated) {
        setScannedSerialNumbers([]);
        return finishingProcess({
          setValue,
          openNotificationWithIcon,
          setLoadingStatus,
          user,
          template,
          eventItem: template,
        });
      }
    }
    // Add new item to event inventory
    const eventItem = {
      ...template,
      cost: eventInfoDetail?.merchant ? data.deposit || 0 : 0,
      quantity: data.quantity ?? data.qty,
      existing: true,
      consumerUses: false,
      company: user.company,
      ownership: data.ownership || "Rent",
    };

    addNewItemToEvent(
      selectedItems,
      setSelectedItem,
      dispatch,
      onAddDeviceSetup,
      eventItem
    );

    // Reset form values
    setScannedSerialNumbers([]);
    return finishingProcess({
      setValue,
      openNotificationWithIcon,
      setLoadingStatus,
      user,
      template,
      eventItem,
    });
  } catch (error) {
    message.error("Failed to create new item: " + error.message);
    throw error;
  }
};

export const bulkItemInsertSequentialWithEventCheck = async ({
  data,
  user,
  openNotificationWithIcon,
  setLoadingStatus,
  setValue,
  img_url,
  moreInfo,
  formatDate,
  returningDate,
  subLocationsSubmitted,
  sequencialNumbericInsertItemMutation,
  dicSuppliers,
  // New parameters for event inventory integration
  selectedItems = [],
  setSelectedItem,
  dispatch,
  onAddDeviceSetup,
  eventInfoDetail,
}) => {
  try {
    // Create new item in database
    const template = {
      category_name: data.category_name,
      item_group: data.item_group,
      cost: data.cost,
      brand: data.brand,
      descript_item: data.descript_item,
      ownership: data.ownership,
      min_serial_number: data.min_serial_number,
      max_serial_number: data.max_serial_number,
      warehouse: true,
      main_warehouse: data.tax_location,
      created_at: formatDate(new Date()),
      update_at: formatDate(new Date()),
      company: user.company,
      location: data.location,
      current_location: data.location,
      sub_location: JSON.stringify(subLocationsSubmitted),
      extra_serial_number: JSON.stringify(moreInfo),
      company_id: user.sqlInfo.company_id,
      return_date: data.ownership === "Rent" ? formatDate(returningDate) : null,
      returnedRentedInfo: JSON.stringify([]),
      container: String(data.container).includes("Yes"),
      containerSpotLimit: data.containerSpotLimit,
      isItInContainer: 0,
      containerId: JSON.stringify([]),
      display_item: 1,
      enableAssignFeature: data.enableAssignFeature === "YES" ? 1 : 0,
      image_url: img_url,
      existing: true,
      consumerUses: false,
      qty: data.quantity ?? data.qty,
      quantity: data.quantity ?? data.qty,
      supplier_info: data.supplier
        ? dicSuppliers.find(([key]) => key === data.supplier)[1]
        : null,
    };

    await sequencialNumbericInsertItemMutation.mutate(template);

    // Check if item already exists in event inventory
    const itemExists = checkIfItemExistsInEvent(selectedItems, data.item_group);
    if (itemExists) {
      // Update existing item quantity in event inventory
      const updated = updateExistingItemQuantity(
        selectedItems,
        setSelectedItem,
        dispatch,
        onAddDeviceSetup,
        data.item_group,
        data.quantity ?? data.qty
      );
      if (updated) {
        return finishingProcess({
          setValue,
          openNotificationWithIcon,
          setLoadingStatus,
          user,
          template,
          eventItem: template,
        });
      }
    }

    // Add new item to event inventory
    const eventItem = {
      ...template,
      cost: eventInfoDetail?.merchant ? data.deposit || 0 : 0,
      quantity: data.quantity ?? data.qty,
      existing: true,
      consumerUses: false,
      company: user.company,
      ownership: data.ownership || "Rent",
      isItSetAsContainerForEvent: false,
    };

    addNewItemToEvent(
      selectedItems,
      setSelectedItem,
      dispatch,
      onAddDeviceSetup,
      eventItem
    );

    // Reset form values
    return finishingProcess({
      setValue,
      openNotificationWithIcon,
      setLoadingStatus,
      user,
      template,
      eventItem,
    });
  } catch (error) {
    message.error("Failed to create new item: " + error.message);
    throw error;
  }
};

// Keep original functions for backward compatibility
export const bulkItemInsertAlphanumeric = async ({
  data,
  user,
  openNotificationWithIcon,
  setLoadingStatus,
  setValue,
  img_url,
  moreInfo,
  formatDate,
  returningDate,
  subLocationsSubmitted,
  scannedSerialNumbers,
  setScannedSerialNumbers,
  alphaNumericInsertItemMutation,
  dicSuppliers,
}) => {
  try {
    const template = {
      category_name: data.category_name,
      item_group: data.item_group,
      cost: data.cost,
      brand: data.brand,
      descript_item: data.descript_item,
      ownership: data.ownership,
      list: scannedSerialNumbers,
      warehouse: true,
      main_warehouse: data.tax_location,
      created_at: formatDate(new Date()),
      update_at: formatDate(new Date()),
      company: user.company,
      location: data.location,
      current_location: data.location,
      sub_location: JSON.stringify(subLocationsSubmitted),
      extra_serial_number: JSON.stringify(moreInfo),
      company_id: user.sqlInfo.company_id,
      return_date: data.ownership === "Rent" ? formatDate(returningDate) : null,
      returnedRentedInfo: JSON.stringify([]),
      container: String(data.container).includes("Yes"),
      containerSpotLimit: data.containerSpotLimit,
      isItInContainer: JSON.stringify([]),
      containerId: JSON.stringify([]),
      display_item: 1,
      enableAssignFeature: data.enableAssignFeature === "YES" ? 1 : 0,
      image_url: img_url,
      existing: true,
      consumerUses: false,
      qty: data.quantity ?? data.qty,
      quantity: data.quantity ?? data.qty,
      supplier_info: data.supplier
        ? dicSuppliers.find(([key]) => key === data.supplier)[1]
        : null,
    };
    await alphaNumericInsertItemMutation.mutate(template);
    setValue("category_name", "");
    setValue("item_group", "");
    setValue("cost", "");
    setValue("brand", "");
    setValue("descript_item", "");
    setValue("ownership", "");
    setValue("quantity", 0);
    setValue("location", "");
    setValue("tax_location", "");
    setValue("container", "");
    setValue("containerSpotLimit", "0");
    setScannedSerialNumbers([]);
    openNotificationWithIcon(
      "New group of items were created and stored in database."
    );
    setLoadingStatus(false);
    await clearCacheMemory(
      `company_id=${user.companyData.id}&warehouse=true&enableAssignFeature=1`
    );
    return template;
  } catch (error) {
    message.error("Failed to create new item: " + error.message);
    throw error;
  }
};

export const bulkItemInsertSequential = async ({
  data,
  user,
  openNotificationWithIcon,
  setLoadingStatus,
  setValue,
  img_url,
  moreInfo,
  formatDate,
  returningDate,
  subLocationsSubmitted,
  sequencialNumbericInsertItemMutation,
  dicSuppliers,
}) => {
  try {
    const template = {
      category_name: data.category_name,
      item_group: data.item_group,
      cost: data.cost,
      brand: data.brand,
      descript_item: data.descript_item,
      ownership: data.ownership,
      min_serial_number: data.min_serial_number,
      max_serial_number: data.max_serial_number,
      warehouse: true,
      main_warehouse: data.tax_location,
      created_at: formatDate(new Date()),
      update_at: formatDate(new Date()),
      company: user.company,
      location: data.location,
      current_location: data.location,
      sub_location: JSON.stringify(subLocationsSubmitted),
      extra_serial_number: JSON.stringify(moreInfo),
      company_id: user.sqlInfo.company_id,
      return_date: data.ownership === "Rent" ? formatDate(returningDate) : null,
      returnedRentedInfo: JSON.stringify([]),
      container: String(data.container).includes("Yes"),
      containerSpotLimit: data.containerSpotLimit,
      isItInContainer: 0,
      containerId: JSON.stringify([]),
      display_item: 1,
      enableAssignFeature: data.enableAssignFeature === "YES" ? 1 : 0,
      image_url: img_url,
      existing: true,
      consumerUses: false,
      qty: data.quantity ?? data.qty,
      quantity: data.quantity ?? data.qty,
      supplier_info: data.supplier
        ? dicSuppliers.find(([key]) => key === data.supplier)[1]
        : null,
    };
    await sequencialNumbericInsertItemMutation.mutate(template);
    setValue("category_name", "");
    setValue("item_group", "");
    setValue("cost", "");
    setValue("brand", "");
    setValue("descript_item", "");
    setValue("ownership", "");
    setValue("min_serial_number", "");
    setValue("max_serial_number", "");
    setValue("quantity", 0);
    setValue("location", "");
    setValue("tax_location", "");
    setValue("container", "");
    setValue("containerSpotLimit", "0");
    openNotificationWithIcon(
      "New group of items were created and stored in database."
    );
    setLoadingStatus(false);
    await clearCacheMemory(
      `company_id=${user.companyData.id}&warehouse=true&enableAssignFeature=1`
    );
    return template;
  } catch (error) {
    message.error("Failed to create new item: " + error.message);
    throw error;
  }
};
