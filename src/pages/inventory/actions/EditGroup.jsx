import { Grid } from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import "../../../styles/global/ant-select.css";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import "../../../styles/global/reactInput.css";
import "./style.css";
// import { renderingModals } Ffrom "./utils/BulkComponents";
import { renderTitle } from "./utils/EditBulkComponents";
import EditBulkForm from "./utils/EditBulkForm";
import NewSupplier from "./utils/suppliers/NewSupplier";
import useBulkActionLogic from "./add/useBulkActionLogic";
import { renderingModals } from "./utils/BulkComponents";

const options = [
  { value: "Permanent" },
  { value: "Rent" },
  { value: "Resale" },
];

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
    renderingOptionsForSubLocations,
    renderLocationOptions,
    retrieveItemOptions,
    returningDate,
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
    setSupplierModal,
    setValueObject,
    subLocationInputs,
    subLocationsOptions,
    subLocationsSubmitted,
    supplierList,
    supplierModal,
    user,
    valueObject,
    watch,
    updateGroupItems
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
        renderingOptionsForSubLocations={renderingOptionsForSubLocations}
        renderLocationOptions={renderLocationOptions}
        retrieveItemOptions={retrieveItemOptions}
        returningDate={returningDate}
        savingNewItem={updateGroupItems}
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
