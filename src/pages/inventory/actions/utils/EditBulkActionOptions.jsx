import { devitrakApi } from "../../../../api/devitrakApi";
import ImageUploaderFormat from "../../../../classes/imageCloudinaryFormat";
import { convertToBase64 } from "../../../../components/utils/convertToBase64";
import clearCacheMemory from "../../../../utils/actions/clearCacheMemory";

export const bulkItemUpdateAlphanumeric = async ({
  data,
  user,
  navigate,
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
  originalTemplate,
  alphaNumericUpdateItemMutation,
  dicSuppliers,
}) => {
  if (!scannedSerialNumbers || scannedSerialNumbers.length === 0) {
    return alert("Please scan at least one serial number.");
  }
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
    display_item: 1,
    enableAssignFeature: data.enableAssignFeature === "Enabled" ? 1 : 0,
    image_url: img_url,
    originalTemplate: originalTemplate,
    supplier_info: data.supplier
      ? dicSuppliers.find(([key]) => key === data.supplier)[1]
      : null,
  };
  await alphaNumericUpdateItemMutation.mutate(template);
  Object.keys(template).map((key) => {
    setValue(key, "");
  });
  setScannedSerialNumbers([]);
  openNotificationWithIcon(
    "New group of items were created and stored in database."
  );
  setLoadingStatus(false);
  await clearCacheMemory(
    `company_id=${user.companyData.id}&warehouse=true&enableAssignFeature=1`
  );
  await clearCacheMemory(`providerCompanies_${user.companyData.id}`);

  return navigate("/inventory");
};

export const bulkItemUpdateSequential = async ({
  data,
  user,
  navigate,
  openNotificationWithIcon,
  setLoadingStatus,
  setValue,
  img_url,
  moreInfo,
  formatDate,
  returningDate,
  subLocationsSubmitted,
  originalTemplate,
  sequencialNumbericUpdateItemMutation,
  dicSuppliers,
}) => {
  if (!data.min_serial_number || !data.max_serial_number) {
    return alert("Min serial number and max serial number are required.");
  }
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
    display_item: 1,
    enableAssignFeature: data.enableAssignFeature === "Enabled" ? 1 : 0,
    image_url: img_url || null,
    originalTemplate: originalTemplate,
    supplier_info: data.supplier
      ? dicSuppliers.find(([key]) => key === data.supplier)[1]
      : null,
  };
  await sequencialNumbericUpdateItemMutation.mutate(template);
  Object.keys(template).map((key) => {
    setValue(key, "");
  });
  openNotificationWithIcon(
    "New group of items were created and stored in database."
  );
  setLoadingStatus(false);
  await clearCacheMemory(
    `company_id=${user.companyData.id}&warehouse=true&enableAssignFeature=1`
  );
  await clearCacheMemory(`providerCompanies_${user.companyData.id}`);
  return navigate("/inventory");
};

export const updateAllItemsBasedOnParameters = async ({
  data,
  user,
  navigate,
  openNotificationWithIcon,
  setLoadingStatus,
  setValue,
  img_url,
  moreInfo,
  formatDate,
  returningDate,
  subLocationsSubmitted,
  originalTemplate,
  updateAllItemsMutation,
  dicSuppliers,
}) => {
  if (!data.category_name || !data.item_group) {
    return alert("Category name and item group are required.");
  }
  const newTemplate = {
    category_name: data.category_name,
    item_group: data.item_group,
    cost: data.cost,
    brand: data.brand,
    descript_item: data.descript_item,
    ownership: data.ownership,
    warehouse: true,
    main_warehouse: data.tax_location,
    update_at: formatDate(new Date()),
    location: data.location,
    current_location: data.location,
    sub_location: JSON.stringify(subLocationsSubmitted),
    extra_serial_number: JSON.stringify(moreInfo),
    company_id: user.sqlInfo.company_id,
    return_date: data.ownership === "Rent" ? formatDate(returningDate) : null,
    returnedRentedInfo: JSON.stringify([]),
    container: String(data.container).includes("Yes"),
    containerSpotLimit: data.containerSpotLimit,
    display_item: 1,
    enableAssignFeature: data.enableAssignFeature === "Enabled" ? 1 : 0,
    image_url: img_url || null,
    originalTemplate: originalTemplate,
    supplier_info: data.supplier
      ? dicSuppliers.find(([key]) => key === data.supplier)[1]
      : null,
  };
  await updateAllItemsMutation.mutate(newTemplate);
  await clearCacheMemory(
    `company_id=${user.companyData.id}&warehouse=true&enableAssignFeature=1`
  );

  Object.keys(newTemplate).forEach((key) => {
    setValue(key, "");
  });
  setLoadingStatus(false);
  openNotificationWithIcon("All items were updated database.");
  return navigate("/inventory");
};

export const storeAndGenerateImageUrl = ({
  data,
  imageUploadedValue,
  user,
}) => {
  let base64;
  let img_url;
  if (!data.category_name || !data.item_group) {
    return alert("Category name and item group are required.");
  }
  const fetchingImage = async () => {
    base64 = await convertToBase64(imageUploadedValue[0]);
    const templateImageUpload = new ImageUploaderFormat(
      base64,
      user.companyData.id,
      data.category_name,
      data.item_group,
      "",
      "",
      "",
      "",
      ""
    );
    const registerImage = await devitrakApi.post(
      "/cloudinary/upload-image",
      templateImageUpload.item_uploader()
    );
    await devitrakApi.post(`/image/new_image`, {
      source: registerImage.data.imageUploaded.secure_url,
      category: data.category_name,
      item_group: data.item_group,
      company: user.companyData.id,
    });
    return registerImage.data.imageUploaded.secure_url;
  };
  img_url = fetchingImage();
  return img_url;
};
