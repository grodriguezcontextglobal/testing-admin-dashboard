import { Grid } from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import "../../../styles/global/ant-select.css";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import "../../../styles/global/reactInput.css";
import "./style.css";
import { renderingModals, renderTitle } from "./utils/BulkComponents";
import BulkItemForm from "./utils/BulkItemForm";
import NewSupplier from "./utils/suppliers/NewSupplier";
import useBulkActionLogic from "./add/useBulkActionLogic";
const options = [{ value: "Permanent" }, { value: "Rent" }, { value: "Sale" }];
const AddNewBulkItems = () => {
  const {
    supplierList,
    supplierModal,
    providersList,
    setSupplierModal,
    refetchingAfterNewSupplier,
    queryClient,
    loadingStatus,
    moreInfoDisplay,
    setMoreInfoDisplay,
    moreInfo,
    keyObject,
    setKeyObject,
    valueObject,
    setValueObject,
    returningDate,
    setReturningDate,
    setImageUploadedValue,
    displayContainerSplotLimitField,
    displaySublocationFields,
    subLocationsSubmitted,
    setSubLocationsSubmitted,
    allSerialNumbersOptions,
    addSerialNumberField,
    setAddSerialNumberField,
    rangeFormat,
    scannedSerialNumbers,
    setScannedSerialNumbers,
    openScanningModal,
    setOpenScanningModal,
    openScannedItemView,
    setOpenScannedItemView,
    labeling,
    isRented,
    displayPreviewImage,
    imageUrlGenerated,
    convertImageTo64ForPreview,
    register,
    handleSubmit,
    watch,
    control,
    errors,
    contextHolder,
    retrieveItemOptions,
    renderLocationOptions,
    savingNewItem,
    handleMoreInfoPerDevice,
    handleDeleteMoreInfo,
    subLocationsOptions,
    renderingOptionsForSubLocations,
    addingSubLocation,
    manuallyAddingSerialNumbers,
    acceptAndGenerateImage,
    user,
  } = useBulkActionLogic();
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
        suppliersOptions={supplierList}
        valueObject={valueObject}
        watch={watch}
        imageUrlGenerated={imageUrlGenerated}
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

export default AddNewBulkItems;
