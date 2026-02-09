import { useMutation, useQueryClient } from "@tanstack/react-query";
import { devitrakApi } from "../../../../../api/devitrakApi";
import validatingInputFields from "../../utils/validatingInputFields";
import {
  bulkItemInsertAlphanumeric,
  bulkItemInsertSequential,
} from "../../utils/BulkItemActionsOptions";
import { formatDate } from "../../../utils/dateFormat";
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

  const alphaNumericInsertItemMutation = useMutation({
    mutationFn: (template) =>
      devitrakApi.post("/db_item/bulk-item-alphanumeric", template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listOfItemsInStock"] });
      queryClient.invalidateQueries({ queryKey: ["ItemsInInventoryCheckingQuery"] });
      queryClient.invalidateQueries({ queryKey: ["RefactoredListInventoryCompany"] });
    },
  });

  const sequencialNumbericInsertItemMutation = useMutation({
    mutationFn: (template) => devitrakApi.post("/db_item/bulk-item", template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listOfItemsInStock"] });
      queryClient.invalidateQueries({ queryKey: ["ItemsInInventoryCheckingQuery"] });
      queryClient.invalidateQueries({ queryKey: ["RefactoredListInventoryCompany"] });
    },
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
