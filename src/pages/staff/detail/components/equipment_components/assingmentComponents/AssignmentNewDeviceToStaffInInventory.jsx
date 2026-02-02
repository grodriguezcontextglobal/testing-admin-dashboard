import NewSupplier from "../../../../../inventory/actions/utils/suppliers/NewSupplier";
import SingleItemForm from "./components/newDevice/SingleForm";
import LegalDocumentModal from "./components/legalDOcuments/LegalDocumentModal";
import { useAssignmentLogic } from "./newDeviceAssignmentLogic/useAssignmentLogic";

const AssignmentNewDeviceToStaffInInventory = () => {
  const {
    acceptAndGenerateImage,
    addContracts,
    addingSubLocation,
    closeModal,
    contextHolder,
    contractList,
    control,
    convertImageTo64ForPreview,
    displayContainerSplotLimitField,
    displayPreviewImage,
    displaySublocationFields,
    errors,
    gripingFields,
    handleDeleteMoreInfo,
    handleMoreInfoPerDevice,
    handleSubmit,
    // imageUploadedValue,
    imageUrlGenerated,
    isRented,
    keyObject,
    loadingStatus,
    moreInfo,
    moreInfoDisplay,
    options,
    OutlinedInputStyle,
    profile,
    providersList,
    queryClient,
    register,
    renderingOptionsForSubLocations,
    renderLocationOptions,
    retrieveItemOptions,
    returningDate,
    savingNewItem,
    setAddContracts,
    setContractList,
    setImageUploadedValue,
    setKeyObject,
    setMoreInfoDisplay,
    setReturningDate,
    setSubLocationsSubmitted,
    setSupplierModal,
    setValue,
    setValueObject,
    subLocationsOptions,
    subLocationsSubmitted,
    supplierList,
    supplierModal,
    user,
    valueObject,
    watch,
    refetchingAfterNewSupplier
  } = useAssignmentLogic();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      }}
    >
      {contextHolder}
      <div
        style={{
          marginBottom: "1rem",
          width: "100%",
        }}
      >
        <LegalDocumentModal
          addContracts={addContracts}
          setAddContracts={setAddContracts}
          setValue={setValue}
          register={register}
          loadingStatus={loadingStatus}
          profile={profile}
          selectedDocuments={contractList}
          setSelectedDocuments={setContractList}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <SingleItemForm
          acceptImage={acceptAndGenerateImage}
          addingSubLocation={addingSubLocation}
          control={control}
          closeModal={closeModal}
          displayContainerSplotLimitField={displayContainerSplotLimitField}
          displayPreviewImage={displayPreviewImage}
          displaySublocationFields={displaySublocationFields}
          errors={errors}
          gripingFields={gripingFields}
          handleDeleteMoreInfo={handleDeleteMoreInfo}
          handleMoreInfoPerDevice={handleMoreInfoPerDevice}
          handleSubmit={handleSubmit}
          imageUploadedValue={convertImageTo64ForPreview}
          imageUrlGenerated={imageUrlGenerated}
          isRented={isRented}
          keyObject={keyObject}
          loadingStatus={loadingStatus}
          moreInfo={moreInfo}
          moreInfoDisplay={moreInfoDisplay}
          options={options}
          OutlinedInputStyle={OutlinedInputStyle}
          register={register}
          renderingOptionsForSubLocations={renderingOptionsForSubLocations}
          renderLocationOptions={renderLocationOptions}
          retrieveItemOptions={retrieveItemOptions}
          returningDate={returningDate}
          savingNewItem={savingNewItem}
          setImageUploadedValue={setImageUploadedValue}
          setKeyObject={setKeyObject}
          setMoreInfoDisplay={setMoreInfoDisplay}
          setReturningDate={setReturningDate}
          setSubLocationsSubmitted={setSubLocationsSubmitted}
          setValueObject={setValueObject}
          subLocationsOptions={subLocationsOptions}
          subLocationsSubmitted={subLocationsSubmitted}
          suppliersOptions={supplierList}
          valueObject={valueObject}
          watch={watch}
        />
      </div>
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
    </div>
  );
};

export default AssignmentNewDeviceToStaffInInventory;
