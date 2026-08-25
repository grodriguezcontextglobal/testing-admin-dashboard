import { useMutation, useQueryClient } from "@tanstack/react-query";
import { devitrakApi } from "../../../../../api/devitrakApi";
import validatingInputFields from "../../utils/validatingInputFields";
import {
  bulkItemInsertAlphanumeric,
  bulkItemInsertSequential,
} from "../../utils/BulkItemActionsOptions";
import { formatDate } from "../../../utils/dateFormat";
import { invalidateInventoryQueries } from "../../../utils/inventoryQueryKeys";
const useBulkItemMutations = ({ 
    user, 
    navigate, 
    openNotificationWithIcon, 
    setLoadingStatus, 
    setValue, 
    moreInfo, 
    returningDate, 
    subLocationsSubmitted, 
    scannedSerialNumbers, 
    setScannedSerialNumbers, 
    dicSuppliers 
}) => {
  const queryClient = useQueryClient();

  // Both bulk endpoints listed the same three keys by hand and both missed the
  // /inventory landing fetch, so a bulk group could be created and still not
  // show up on the page the flow navigates back to.
  const refreshInventoryPage = () =>
    invalidateInventoryQueries(queryClient, {
      companyId: user?.sqlInfo?.company_id,
    });

  const alphaNumericInsertItemMutation = useMutation({
    mutationFn: (template) =>
      devitrakApi.post("/db_item/bulk-item-alphanumeric", template),
    onSuccess: refreshInventoryPage,
  });

  const sequencialNumbericInsertItemMutation = useMutation({
    mutationFn: (template) => devitrakApi.post("/db_item/bulk-item", template),
    onSuccess: refreshInventoryPage,
  });

  const savingNewItem = async (data, imageUrlGenerated) => {
    validatingInputFields({
      data,
      openNotificationWithIcon,
      returningDate,
    });
    if (
      scannedSerialNumbers.length === 0 &&
      Number(data.max_serial_number) < Number(data.min_serial_number)
    ) {
      return openNotificationWithIcon(
        "Max serial number must be greater than min serial number."
      );
    }
    try {
      if (scannedSerialNumbers.length > 0) {
        await bulkItemInsertAlphanumeric({
          data,
          user,
          navigate,
          openNotificationWithIcon,
          setLoadingStatus,
          setValue,
          img_url: imageUrlGenerated ? imageUrlGenerated : data.image_url,
          moreInfo,
          formatDate,
          returningDate,
          subLocationsSubmitted,
          scannedSerialNumbers,
          setScannedSerialNumbers,
          alphaNumericInsertItemMutation,
          dicSuppliers,
          queryClient,
        });
      } else {
        await bulkItemInsertSequential({
          data,
          user,
          navigate,
          openNotificationWithIcon,
          setLoadingStatus,
          setValue,
          img_url: imageUrlGenerated ? imageUrlGenerated : data.image_url,
          moreInfo,
          formatDate,
          returningDate,
          subLocationsSubmitted,
          sequencialNumbericInsertItemMutation,
          dicSuppliers,
          queryClient,
        });
      }
      return setLoadingStatus(false);
    } catch (error) {
      openNotificationWithIcon(`${error.message}`);
      setLoadingStatus(false);
    }
  };

  return {
    alphaNumericInsertItemMutation,
    sequencialNumbericInsertItemMutation,
    savingNewItem,
    queryClient
  };
};

export default useBulkItemMutations;
