import { devitrakApi } from "../../../../api/devitrakApi";
import clearCacheMemory from "../../../../utils/actions/clearCacheMemory";

export const singleItemInserting = async ({
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
  invalidateQueries,
  dicSuppliers,
}) => {
  const template = {
    category_name: data.category_name,
    item_group: data.item_group,
    cost: data.cost,
    brand: data.brand,
    descript_item: data.descript_item,
    ownership: data.ownership,
    serial_number: data.serial_number,
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
    supplier_info: data.supplier
      ? dicSuppliers.find(([key]) => key === data.supplier)[1]
      : null,
  };
  setLoadingStatus(true);
  await devitrakApi.post("/db_item/new_item", template);
  await invalidateQueries();
  setValue("category_name", "");
  setValue("item_group", "");
  setValue("cost", "");
  setValue("brand", "");
  setValue("descript_item", "");
  setValue("ownership", "");
  setValue("serial_number", "");
  setValue("quantity", 0);
  setValue("location", "");
  setValue("tax_location", "");
  setValue("container", "");
  setValue("containerSpotLimit", "0");
  openNotificationWithIcon("New item was created and stored in database.");
  setLoadingStatus(false);
  await clearCacheMemory(
    `company_id=${user.companyData.id}&warehouse=true&enableAssignFeature=1`
  );
  await clearCacheMemory(`providerCompanies_${user.companyData.id}`);

  return navigate("/inventory");
  // }
};
