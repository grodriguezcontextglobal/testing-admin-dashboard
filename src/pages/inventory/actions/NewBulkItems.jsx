import { Typography } from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import "../../../styles/global/ant-select.css";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import "../../../styles/global/reactInput.css";
import "./style.css";
import { renderingModals } from "./utils/BulkComponents";
import NewSupplier from "./utils/suppliers/NewSupplier";
import useCreateGroupWizard from "./add/useCreateGroupWizard";
import WizardStepper from "./utils/WizardStepper";
import DetailsStep from "./add/ux/wizard/DetailsStep";
import LocationStep from "./add/ux/wizard/LocationStep";
import OwnershipStep from "./add/ux/wizard/OwnershipStep";
import UnitsStep from "./add/ux/wizard/UnitsStep";
import ReviewStep from "./add/ux/wizard/ReviewStep";

const options = [
  { value: "Permanent" },
  { value: "Rent" },
  { value: "Resale" },
];

const STEPS = [
  { key: "details", label: "Details" },
  { key: "location", label: "Location" },
  { key: "ownership", label: "Ownership" },
  { key: "units", label: "Units" },
  { key: "review", label: "Review" },
];

const AddNewBulkItems = () => {
  const wizard = useCreateGroupWizard();
  const {
    contextHolder,
    stepIndex,
    currentStep,
    goToStep,
    goBack,
    openScanningModal,
    setOpenScanningModal,
    openScannedItemView,
    setOpenScannedItemView,
    scannedSerialNumbers,
    setScannedSerialNumbers,
    supplierModal,
    setSupplierModal,
    providersList,
    queryClient,
    user,
    refetchingAfterNewSupplier,
  } = wizard;

  return (
    <div style={{ width: "100%", maxWidth: "1400px", margin: "0 auto", padding: "32px 16px", textAlign: "left" }}>
      {contextHolder}
      <Typography variant="caption" color="text.secondary">Inventory</Typography>
      <Typography variant="h4" sx={{ fontWeight: 600, letterSpacing: "-0.72px", mt: 0.5, mb: 0.5 }}>
        Add new inventory
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Create a new group of items, then add the units that make it up. Nothing is created until the last step.
      </Typography>

      <WizardStepper steps={STEPS} stepIndex={stepIndex} onSelectStep={goToStep} />

      {currentStep === "details" && (
        <DetailsStep
          control={wizard.control}
          displayContainerSplotLimitField={wizard.displayContainerSplotLimitField}
          displayPreviewImage={wizard.displayPreviewImage}
          errors={wizard.errors}
          handleSearchByReference={wizard.handleSearchByReference}
          clearReferenceCopy={wizard.clearReferenceCopy}
          copiedFrom={wizard.copiedFrom}
          imageUploadedValue={wizard.convertImageTo64ForPreview}
          imageUrlGenerated={wizard.imageUrlGenerated}
          loadingStatus={wizard.loadingStatus}
          options={options}
          OutlinedInputStyle={OutlinedInputStyle}
          register={wizard.register}
          renderLocationOptions={wizard.renderLocationOptions}
          retrieveItemOptions={wizard.retrieveItemOptions}
          returningDate={wizard.returningDate}
          setImageUploadedValue={wizard.setImageUploadedValue}
          setReturningDate={wizard.setReturningDate}
          subLocationsOptions={wizard.subLocationsOptions}
          suppliersOptions={wizard.supplierList}
          watch={wizard.watch}
          goNext={wizard.goNextFromDetails}
        />
      )}

      {currentStep === "location" && (
        <LocationStep
          addingSubLocation={wizard.addingSubLocation}
          control={wizard.control}
          errors={wizard.errors}
          loadingStatus={wizard.loadingStatus}
          OutlinedInputStyle={OutlinedInputStyle}
          register={wizard.register}
          renderLocationOptions={wizard.renderLocationOptions}
          retrieveItemOptions={wizard.retrieveItemOptions}
          returningDate={wizard.returningDate}
          setReturningDate={wizard.setReturningDate}
          setSubLocationsSubmitted={wizard.setSubLocationsSubmitted}
          subLocationsOptions={wizard.subLocationsOptions}
          subLocationsSubmitted={wizard.subLocationsSubmitted}
          watch={wizard.watch}
          goBack={goBack}
          goNext={wizard.goNextFromLocation}
        />
      )}

      {currentStep === "ownership" && (
        <OwnershipStep
          control={wizard.control}
          errors={wizard.errors}
          isRented={wizard.isRented}
          loadingStatus={wizard.loadingStatus}
          options={options}
          OutlinedInputStyle={OutlinedInputStyle}
          register={wizard.register}
          returningDate={wizard.returningDate}
          setReturningDate={wizard.setReturningDate}
          suppliersOptions={wizard.supplierList}
          watch={wizard.watch}
          goBack={goBack}
          goNext={wizard.goNextFromOwnership}
        />
      )}

      {currentStep === "units" && (
        <UnitsStep
          moreInfo={wizard.moreInfo}
          scannedSerialNumbers={scannedSerialNumbers}
          setMoreInfo={wizard.setMoreInfo}
          setScannedSerialNumbers={setScannedSerialNumbers}
          goBack={goBack}
          goNext={wizard.goNextFromUnits}
        />
      )}

      {currentStep === "review" && (
        <ReviewStep
          watch={wizard.watch}
          scannedSerialNumbers={scannedSerialNumbers}
          moreInfo={wizard.moreInfo}
          subLocationsSubmitted={wizard.subLocationsSubmitted}
          imageUrlGenerated={wizard.imageUrlGenerated}
          handleSubmit={wizard.handleSubmit}
          savingNewItem={wizard.savingNewItem}
          loadingStatus={wizard.loadingStatus}
          goToStep={goToStep}
        />
      )}

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
    </div>
  );
};

export default AddNewBulkItems;
