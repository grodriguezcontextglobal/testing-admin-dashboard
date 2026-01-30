import { Grid } from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import "../../../styles/global/ant-select.css";
import "../../../styles/global/reactInput.css";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import "./style.css";
import { renderingModals } from "./utils/BulkComponents";
import { renderTitle } from "./utils/EditBulkComponents";
import EditBulkForm from "./utils/EditBulkForm";
import NewSupplier from "./utils/suppliers/NewSupplier";
import useLogic from "./edit/useLogic";

const options = [{ value: "Permanent" }, { value: "Rent" }, { value: "Sale" }];

const EditGroup = () => {
  const {
    acceptAndGenerateImage,
    addingSubLocation,
    addSerialNumberField,
    allSerialNumbersOptions,
    contextHolder,
    control,
    convertImageTo64ForPreview,
    displayContainerSplotLimitField,
    displayPreviewImage,
    displaySublocationFields,
    errors,
    handleDeleteMoreInfo,
    handleMoreInfoPerDevice,
    handleSubmit,
    imageUrlGenerated,
    // imageUploadedValue,
    isRented,
    keyObject,
    labeling,
    loadingStatus,
    manuallyAddingSerialNumbers,
    moreInfo,
    moreInfoDisplay,
    openScannedItemView,
    openScanningModal,
    providersList,
    queryClient,
    rangeFormat,
    refetchingAfterNewSupplier,
    register,
    removeImage,
    renderingOptionsForSubLocations,
    renderLocationOptions,
    retrieveItemOptions,
    returningDate,
    savingNewItem,
    scannedSerialNumbers,
    setAddSerialNumberField,
    setImageUploadedValue,
    setKeyObject,
    setMoreInfoDisplay,
    setOpenScannedItemView,
    setOpenScanningModal,
    setRemoveImage,
    setReturningDate,
    setScannedSerialNumbers,
    setSubLocationsSubmitted,
    setSupplierModal,
    setUpdateAllItems,
    setValueObject,
    subLocationsOptions,
    subLocationsSubmitted,
    supplierList,
    supplierModal,
    updateAllItems,
    user,
    valueObject,
    watch,
  } = useLogic();
console.log(displaySublocationFields)
  return (
    <Grid
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      container
    >
      {contextHolder}
      {renderTitle()}
      <EditBulkForm
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
        removeImage={removeImage}
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
        setRemoveImage={setRemoveImage}
        setReturningDate={setReturningDate}
        setSubLocationsSubmitted={setSubLocationsSubmitted}
        setUpdateAllItems={setUpdateAllItems}
        setValueObject={setValueObject}
        subLocationsOptions={subLocationsOptions}
        subLocationsSubmitted={subLocationsSubmitted}
        updateAllItems={updateAllItems}
        valueObject={valueObject}
        watch={watch}
        imageUrlGenerated={imageUrlGenerated}
        suppliersOptions={supplierList}
      />
      {renderingModals({
        openScanningModal,
        setOpenScanningModal,
        openScannedItemView,
        setOpenScannedItemView,
        scannedSerialNumbers,
        setScannedSerialNumbers,
      })}
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

export default EditGroup;
