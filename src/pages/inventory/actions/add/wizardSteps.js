import { createWizardSteps } from "../wizardStepList";

/**
 * The create-group wizard: five steps, ending on the review.
 *
 * The list lives here and the behaviour in `wizardStepList`, so this file and
 * the update wizard's equivalent cannot drift in how they count.
 */
export const {
  WIZARD_STEPS,
  STEPS,
  stepNumber,
  continueLabel,
  reviewStepNotice,
} = createWizardSteps([
  { key: "details", label: "Details" },
  { key: "location", label: "Location" },
  { key: "ownership", label: "Ownership" },
  { key: "units", label: "Units" },
  { key: "review", label: "Review" },
]);
