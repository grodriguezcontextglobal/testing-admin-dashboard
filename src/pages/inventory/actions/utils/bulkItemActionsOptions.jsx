import { message } from "antd";
import { devitrakApi } from "../../../../api/devitrakApi";
import { convertToBase64 } from "../../../../components/utils/convertToBase64";
import clearCacheMemory from "../../../../utils/actions/clearCacheMemory";

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
      supplier_info: data.supplier ? dicSuppliers.find(([key]) => key === data.supplier)[1] : null,
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
    await clearCacheMemory(`providerCompanies_${user.companyData.id}`);
    return navigate("/inventory");
  } catch (error) {
    message.error("Failed to create new item: " + error.message);
    throw error;
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
  sequencialNumbericInsertItemMutation,
  dicSuppliers,
}) => {
  try {
    // console.log(data)
    // console.log(dicSuppliers)
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
      supplier_info: data.supplier ? dicSuppliers.find(([key]) => key === data.supplier)[1] : null,
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
    await clearCacheMemory(`providerCompanies_${user.companyData.id}`);

    return navigate("/inventory");
  } catch (error) {
    message.error("Failed to create new item: " + error.message);
    throw error;
  }
};

export const storeAndGenerateImageUrl = async ({
  data,
  imageUploadedValue,
  user,
}) => {
  try {
    if (!imageUploadedValue || !imageUploadedValue[0]) {
      throw new Error("No image file provided");
    }

    const base64 = await convertToBase64(imageUploadedValue[0]);
    const template = {
      imageFile: base64,
      imageID: `${user.companyData.id}_${data.category_name}_${data.item_group}`,
      tags: JSON.stringify([
        user.companyData.id,
        data.item_group,
        data.category_name,
      ]),
      context: `category_name:${data.category_name}|group_name:${
        data.item_group
      }|created_at:${Date.now()}|updated_at:${Date.now()}`,
    };

    const registerImage = await devitrakApi.post(
      "/cloudinary/upload-image",
      template
    );

    await devitrakApi.post(`/image/new_image`, {
      source: registerImage.data.imageUploaded.secure_url,
      category: data.category_name,
      item_group: data.item_group,
      company: user.companyData.id,
    });

    return registerImage.data.imageUploaded.secure_url;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};
