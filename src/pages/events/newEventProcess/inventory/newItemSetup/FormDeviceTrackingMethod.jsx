import { Grid } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { message, notification } from "antd";
import { useForm } from "react-hook-form";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { onAddDeviceSetup } from "../../../../../store/slices/eventSlice";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import NewSupplier from "../../../../inventory/actions/utils/suppliers/NewSupplier";
import { formatDate } from "../../../../inventory/utils/dateFormat";
import useSuppliers from "../../../../inventory/utils/hooks/useSuppliers";
import useBulkActionLogic from "../../../../inventory/actions/add/useBulkActionLogic";
import BulkItemForm from "../../../../inventory/actions/utils/BulkItemForm";
// import { verifyAndCreateLocation } from "../../../../inventory/actions/utils/verifyLocationBeforeCreateNewInventory";
// import clearCacheMemory from "../../../../../utils/actions/clearCacheMemory";
import { renderTitle } from "./components/BulkRentedItemsComponents";
// import checkIfItemExistsInEvent from "./components/BulkRentedItemsActions";
import { bulkItemInsertAlphanumericWithEventCheck } from "./components/BulkRentedItemsActions";
import "../../../../../styles/global/ant-select.css";
import "../../../../../styles/global/reactInput.css";
import "./style.css";
import { useDispatch } from "react-redux";
import { useState } from "react";

const options = [{ value: "Rent" }];

const FormDeviceTrackingMethod = ({
  selectedItem,
  setSelectedItem,
  setDisplayFormToCreateCategory,
  eventInfoDetail,
}) => {
  
    const alphaNumericInsertItemMutation = useMutation({
      mutationFn: (template) =>
        devitrakApi.post("/db_item/bulk-item-alphanumeric", template),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["listOfItemsInStock"],
          exact: true,
          refetchType: "active",
        });
        queryClient.invalidateQueries({
          queryKey: ["ItemsInInventoryCheckingQuery"],
          exact: true,
          refetchType: "active",
        });
        queryClient.invalidateQueries({
          queryKey: ["RefactoredListInventoryCompany"],
          exact: true,
          refetchType: "active",
        });
      },
    });
      const {
        supplierList,
        supplierModal,
        providersList,
        setSupplierModal,
        refetchingAfterNewSupplier,
        queryClient,
        dicSuppliers,
      } = useSuppliers();
    const [loadingStatus, setLoadingStatus] = useState(false)
  const { setValue }= useForm()
    const [api, contextHolder] = notification.useNotification();
    const openNotificationWithIcon = (msg) => {
      api.open({
        description: msg,
      });
    };
  
const dispatch = useDispatch()  
  const {
    acceptAndGenerateImage,
    addingSubLocation,
    addSerialNumberField,
    allSerialNumbersOptions,
    // contextHolder,
    control,
    convertImageTo64ForPreview,
    displayContainerSplotLimitField,
    displayPreviewImage,
    displaySublocationFields,
    errors,
    handleAddSubLocationInput,
    handleDeleteMoreInfo,
    handleMoreInfoPerDevice,
    handleRemoveSubLocationInput,
    handleSubLocationInputChange,
    handleSubmit,
    imageUrlGenerated,
    isRented,
    keyObject,
    labeling,
    // loadingStatus,
    manuallyAddingSerialNumbers,
    moreInfo,
    moreInfoDisplay,
    // openScannedItemView,
    // openScanningModal,
    rangeFormat,
    register,
    renderingOptionsForSubLocations,
    renderLocationOptions,
    retrieveItemOptions,
    returningDate,
    // savingNewItem,
    scannedSerialNumbers,
    setAddSerialNumberField,
    setImageUploadedValue,
    setKeyObject,
    setMoreInfo,
    setMoreInfoDisplay,
    setOpenScannedItemView,
    setOpenScanningModal,
    setReturningDate,
    setScannedSerialNumbers,
    setSubLocationInputs,
    setSubLocationsSubmitted,
    setValueObject,
    subLocationInputs,
    subLocationsOptions,
    subLocationsSubmitted,
    user,
    valueObject,
    watch,
  } = useBulkActionLogic();

    const savingNewItem = async (data) => {
    try {
const response = await bulkItemInsertAlphanumericWithEventCheck({
  data, user, openNotificationWithIcon, setLoadingStatus, setValue, img_url:imageUrlGenerated, moreInfo, formatDate, returningDate, subLocationsSubmitted, scannedSerialNumbers, setScannedSerialNumbers, alphaNumericInsertItemMutation, dicSuppliers, selectedItems:selectedItem, setSelectedItem, dispatch, onAddDeviceSetup, eventInfoDetail,
}
)      
const respNewItem = [...selectedItem, response];
        setSelectedItem(respNewItem);
        return setDisplayFormToCreateCategory(false)
  } catch (error) {
    message.error("Failed to create new item: " + error.message);
    throw error;
  }
  };

  return (
    <Grid
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      container
    >
      {contextHolder}
      {renderTitle()}
      <BulkItemForm
        acceptImage={acceptAndGenerateImage}
        addingSubLocation={addingSubLocation}
        addSerialNumberField={addSerialNumberField}
        allSerialNumbersOptions={allSerialNumbersOptions}
        control={control}
        displayContainerSplotLimitField={displayContainerSplotLimitField}
        displayPreviewImage={displayPreviewImage}
        displaySublocationFields={displaySublocationFields}
        errors={errors}
        handleDeleteMoreInfo={handleDeleteMoreInfo}
        handleMoreInfoPerDevice={handleMoreInfoPerDevice}
        handleSubmit={handleSubmit}
        imageUploadedValue={convertImageTo64ForPreview}
        isRented={isRented}
        keyObject={keyObject}
        labeling={labeling}
        loadingStatus={loadingStatus}
        manuallyAddingSerialNumbers={manuallyAddingSerialNumbers}
        moreInfo={moreInfo}
        moreInfoDisplay={moreInfoDisplay}
        options={options}
        OutlinedInputStyle={OutlinedInputStyle}
        rangeFormat={rangeFormat}
        register={register}
        renderingOptionsForSubLocations={renderingOptionsForSubLocations}
        renderLocationOptions={renderLocationOptions}
        retrieveItemOptions={retrieveItemOptions}
        returningDate={returningDate}
        savingNewItem={savingNewItem}
        setAddSerialNumberField={setAddSerialNumberField}
        setImageUploadedValue={setImageUploadedValue}
        setKeyObject={setKeyObject}
        setMoreInfoDisplay={setMoreInfoDisplay}
        setOpenScannedItemView={setOpenScannedItemView}
        setOpenScanningModal={setOpenScanningModal}
        setReturningDate={setReturningDate}
        setSubLocationsSubmitted={setSubLocationsSubmitted}
        setValueObject={setValueObject}
        subLocationsOptions={subLocationsOptions}
        subLocationsSubmitted={subLocationsSubmitted}
        subLocationInputs={subLocationInputs}
        setSubLocationInputs={setSubLocationInputs}
        handleAddSubLocationInput={handleAddSubLocationInput}
        handleRemoveSubLocationInput={handleRemoveSubLocationInput}
        handleSubLocationInputChange={handleSubLocationInputChange}
        suppliersOptions={supplierList}
        valueObject={valueObject}
        watch={watch}
        imageUrlGenerated={imageUrlGenerated}
        setMoreInfo={setMoreInfo}
        scannedSerialNumbers={scannedSerialNumbers}
        setScannedSerialNumbers={setScannedSerialNumbers}

      />
      {supplierModal && (
        <NewSupplier
          providersList={providersList}
          queryClient={queryClient}
          setSupplierModal={setSupplierModal}
          supplierModal={supplierModal}
          user={user}
          refetchingAfterNewSupplier={refetchingAfterNewSupplier}
        />
      )}
    </Grid>
  );
};

export default FormDeviceTrackingMethod;
