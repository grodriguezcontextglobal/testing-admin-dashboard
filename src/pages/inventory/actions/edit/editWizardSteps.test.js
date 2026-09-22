import { describe, expect, it } from "vitest";

import {
  STEPS,
  WIZARD_STEPS,
  continueLabel,
  reviewStepNotice,
  stepNumber,
} from "./editWizardSteps";
import { STEPS as ADD_STEPS, continueLabel as addContinueLabel } from "../add/wizardSteps";

/* The two wizards count different numbers of steps and have to say so, which is
   exactly why neither writes the number by hand. */
describe("the update wizard's four steps", () => {
  it("counts its own, not the create wizard's", () => {
    expect(STEPS).toHaveLength(4);
    expect(ADD_STEPS).toHaveLength(5);
    expect(stepNumber("review")).toBe(4);
  });

  it("numbers the buttons that leave a step", () => {
    expect(continueLabel("target")).toBe("Continue to step 2");
    expect(continueLabel("scope")).toBe("Continue to step 3");
    expect(continueLabel("fields")).toBe("Continue to step 4");
  });

  it("has nowhere to send the review, so it just says Continue", () => {
    expect(continueLabel("review")).toBe("Continue");
  });

  /* Same sentence, different number — which is the whole reason it is computed
     rather than typed. */
  it("names its own review step in the notice", () => {
    expect(reviewStepNotice("saved")).toBe(
      "Nothing is saved until you finish the review in step 4."
    );
    expect(addContinueLabel("units")).toBe("Continue to step 5");
  });

  it("is the list STEPS comes from, in order, ending on the review", () => {
    expect(WIZARD_STEPS.map((step) => step.key)).toEqual(STEPS);
    expect(WIZARD_STEPS.at(-1).key).toBe("review");
    for (const step of WIZARD_STEPS) expect(step.label).toBeTruthy();
  });
});
