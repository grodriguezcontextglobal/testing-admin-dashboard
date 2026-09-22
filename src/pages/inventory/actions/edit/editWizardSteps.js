import { createWizardSteps } from "../wizardStepList";

/**
 * The update wizard: four steps, ending on the review.
 *
 * One fewer than the create wizard, which is exactly why neither writes its
 * numbers by hand — the same sentence has to say "step 4" here and "step 5"
 * there.
 *
 * `EditGroup.jsx` kept its own copy of this list, with the labels, beside the
 * hook's copy with the keys. They are one list now.
 */
export const {
  WIZARD_STEPS,
  STEPS,
  stepNumber,
  continueLabel,
  reviewStepNotice,
} = createWizardSteps([
  { key: "target", label: "Find the items" },
  { key: "scope", label: "Choose scope" },
  { key: "fields", label: "Edit fields" },
  { key: "review", label: "Review" },
]);
