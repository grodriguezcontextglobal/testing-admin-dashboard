import { Typography } from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import "../../../styles/global/ant-select.css";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import "../../../styles/global/reactInput.css";
import "./style.css";
import NewSupplier from "./utils/suppliers/NewSupplier";
import { renderingModals } from "./utils/BulkComponents";
import useUpdateInventoryWizard from "./edit/useUpdateInventoryWizard";
import WizardStepper from "./utils/WizardStepper";
import TargetSearchStep from "./edit/ux/wizard/TargetSearchStep";
import ScopeStep from "./edit/ux/wizard/ScopeStep";
import EditFieldsStep from "./edit/ux/wizard/EditFieldsStep";
import ReviewStep from "./edit/ux/wizard/ReviewStep";

const options = [
  { value: "Permanent" },
  { value: "Rent" },
  { value: "Resale" },
];

const STEPS = [
  { key: "target", label: "Find the items" },
  { key: "scope", label: "Choose scope" },
  { key: "fields", label: "Edit fields" },
  { key: "review", label: "Review" },
];

const EditGroup = () => {
  const wizard = useUpdateInventoryWizard();
  const {
    contextHolder,
    stepIndex,
    currentStep,
    goToStep,
    goNext,
    goBack,
    changeTarget,
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
        Update inventory
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Change details on items you already own. Nothing is saved until the last step.
      </Typography>

      <WizardStepper steps={STEPS} stepIndex={stepIndex} onSelectStep={goToStep} />

      {currentStep === "target" && (
        <TargetSearchStep
          control={wizard.control}
          retrieveItemOptions={wizard.retrieveItemOptions}
          searched={wizard.searched}
          matchSummary={wizard.matchSummary}
          confirmTarget={wizard.confirmTarget}
          setValue={wizard.setValue}
        />
      )}

      {currentStep === "scope" && (
        <ScopeStep
          updateAll={wizard.updateAll}
          setUpdateAll={wizard.setUpdateAll}
          scopeMatches={wizard.scopeMatches}
          scopeSummary={wizard.scopeSummary}
          scannedSerialNumbers={scannedSerialNumbers}
          setScannedSerialNumbers={setScannedSerialNumbers}
          setOpenScanningModal={setOpenScanningModal}
          generalInfoForSelection={wizard.generalInfoForSelection}
          moreInfo={wizard.moreInfo}
          setMoreInfo={wizard.setMoreInfo}
          goBack={changeTarget}
          goNext={goNext}
        />
      )}

      {currentStep === "fields" && (
        <EditFieldsStep
          addingSubLocation={wizard.addingSubLocation}
          control={wizard.control}
          displayContainerSplotLimitField={wizard.displayContainerSplotLimitField}
          displayPreviewImage={wizard.displayPreviewImage}
          errors={wizard.errors}
          handleSubmit={wizard.handleSubmit}
          imageUploadedValue={wizard.convertImageTo64ForPreview}
          isRented={wizard.isRented}
          loadingStatus={wizard.loadingStatus}
          manuallyAddingSerialNumbers={wizard.manuallyAddingSerialNumbers}
          matchSummary={wizard.scopeSummary}
          options={options}
          OutlinedInputStyle={OutlinedInputStyle}
          register={wizard.register}
          renderingOptionsForSubLocations={wizard.renderingOptionsForSubLocations}
          renderLocationOptions={wizard.renderLocationOptions}
          retrieveItemOptions={wizard.retrieveItemOptions}
          returningDate={wizard.returningDate}
          setAddSerialNumberField={wizard.setAddSerialNumberField}
          setImageUploadedValue={wizard.setImageUploadedValue}
          setOpenScannedItemView={setOpenScannedItemView}
          setOpenScanningModal={setOpenScanningModal}
          setReturningDate={wizard.setReturningDate}
          setSubLocationsSubmitted={wizard.setSubLocationsSubmitted}
          subLocationsOptions={wizard.subLocationsOptions}
          subLocationsSubmitted={wizard.subLocationsSubmitted}
          suppliersOptions={wizard.supplierList}
          watch={wizard.watch}
          goBack={goBack}
          goNext={goNext}
        />
      )}

      {currentStep === "review" && (
        <ReviewStep
          updateAll={wizard.updateAll}
          scopeSummary={wizard.scopeSummary}
          scannedSerialNumbers={scannedSerialNumbers}
          subLocationsSubmitted={wizard.subLocationsSubmitted}
          watch={wizard.watch}
          handleSubmit={wizard.handleSubmit}
          updateGroupItems={wizard.updateGroupItems}
          loadingStatus={wizard.loadingStatus}
          confirmed={wizard.confirmed}
          setConfirmed={wizard.setConfirmed}
          goBack={goBack}
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

export default EditGroup;
