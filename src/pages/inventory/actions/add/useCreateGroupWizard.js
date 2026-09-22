import { useState } from "react";
import useBulkActionLogic from "./useBulkActionLogic";

import { STEPS } from "./wizardSteps";
import { scrollToFirstFieldError } from "../utils/scrollToFirstFieldError";

/* Re-exported so the hook stays the one import a caller needs; the data itself
   lives in wizardSteps.js, which has no imports of its own. */
export { STEPS, stepNumber, continueLabel } from "./wizardSteps";

const DETAILS_FIELDS = ["category_name", "item_group", "brand", "cost", "container", "containerSpotLimit"];
const LOCATION_FIELDS = ["location", "tax_location"];
const OWNERSHIP_FIELDS = ["ownership", "enableAssignFeature", "supplier"];

/**
 * Wraps useBulkActionLogic() — the same hook the create form always used —
 * with the step navigation the wizard needs. Each step validates only its
 * own fields via react-hook-form's trigger(), so leaving step 1 does not
 * fail on step 3's still-empty fields the way handleSubmit() would.
 */
const useCreateGroupWizard = () => {
  const bulkAction = useBulkActionLogic();
  const { trigger, watch, returningDate, openNotificationWithIcon, scannedSerialNumbers } = bulkAction;

  const [stepIndex, setStepIndex] = useState(0);

  const goToStep = (index) => {
    setStepIndex(Math.max(0, Math.min(STEPS.length - 1, index)));
  };
  const goBack = () => goToStep(stepIndex - 1);

  /* Continue sits at the bottom of a long form and the mandatory fields are at
     the top, so a blocked step is indistinguishable from a dead button — which
     is exactly what was reported (P1 `13:27`). Taking the page to the first
     error is what turns "nothing happened" into "ah, I missed one". */
  const goNextFromDetails = async () => {
    if (await trigger(DETAILS_FIELDS)) goToStep(1);
    else scrollToFirstFieldError();
  };

  const goNextFromLocation = async () => {
    if (await trigger(LOCATION_FIELDS)) goToStep(2);
    else scrollToFirstFieldError();
  };

  const goNextFromOwnership = async () => {
    if (!(await trigger(OWNERSHIP_FIELDS))) {
      scrollToFirstFieldError();
      return;
    }
    // Returning date lives in local state (returningDate/setReturningDate),
    // not as a react-hook-form field, so trigger() never sees it — same
    // reason validatingInputFields() checks it directly at final submit.
    if (watch("ownership") === "Rent" && !returningDate) {
      openNotificationWithIcon("As ownership was set as 'Rent', returning date must be provided.");
      return;
    }
    goToStep(3);
  };

  const goNextFromUnits = () => {
    if (scannedSerialNumbers.length === 0) {
      openNotificationWithIcon("Add at least one unit before continuing.");
      return;
    }
    goToStep(4);
  };

  return {
    ...bulkAction,
    stepIndex,
    currentStep: STEPS[stepIndex],
    goToStep,
    goBack,
    goNextFromDetails,
    goNextFromLocation,
    goNextFromOwnership,
    goNextFromUnits,
  };
};

export default useCreateGroupWizard;
