import { devitrakApi } from "../../../../api/devitrakApi";
import ImageUploaderFormat from "../../../../classes/imageCloudinaryFormat";
import { convertToBase64 } from "../../../../components/utils/convertToBase64";

export const bulkItemInsertAlphanumeric = async ({
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
}) => {
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
    enableAssignFeature: data.enableAssignFeature === "Enabled" ? 1 : 0,
    image_url: img_url,
  };
  const respNewItem = await devitrakApi.post(
    "/db_item/bulk-item-alphanumeric",
    template
  );
  if (respNewItem.data.ok) {
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
    await devitrakApi.post("/cache_update/remove-cache", {
      key: `company_id=${user.companyData.id}&warehouse=true&enableAssignFeature=1`,
    });

    return navigate("/inventory");
  }
};

export const bulkItemInsertSequential = async ({
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
}) => {
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
    isItInContainer: JSON.stringify([]),
    containerId: JSON.stringify([]),
    display_item: 1,
    enableAssignFeature: data.enableAssignFeature === "Enabled" ? 1 : 0,
    image_url: img_url,
  };
  const respNewItem = await devitrakApi.post("/db_item/bulk-item", template);
  if (respNewItem.data.ok) {
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
    await devitrakApi.post("/cache_update/remove-cache", {
      key: `company_id=${user.companyData.id}&warehouse=true&enableAssignFeature=1`,
    });

    return navigate("/inventory");
  }
};

export const storeAndGenerateImageUrl = ({
  data,
  imageUploadedValue,
  user,
}) => {
  let base64;
  let img_url;
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

    img_url = registerImage.data.imageUploaded.secure_url;
    return img_url;
  };
  fetchingImage();
  return img_url;
};
