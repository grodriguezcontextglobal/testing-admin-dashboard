import { describe, expect, it } from "vitest";

import { STEPS, continueLabel, stepNumber } from "./wizardSteps";

/* Fredrik, part 1 `13:15`: "Continue to step 2, to continue to location,
   that's like I didn't pay attention to this… so I got confused." The buttons
   named where they went; the progress bar above them counts. Now both count. */
describe("stepNumber", () => {
  it("counts from 1, like the progress bar", () => {
    expect(stepNumber("details")).toBe(1);
    expect(stepNumber("review")).toBe(STEPS.length);
  });

  it("has no number for something that is not a step", () => {
    expect(stepNumber("nonsense")).toBeNull();
    expect(stepNumber(undefined)).toBeNull();
  });
});

describe("continueLabel", () => {
  it("names the step it is going to, not the screen", () => {
    expect(continueLabel("details")).toBe("Continue to step 2");
    expect(continueLabel("location")).toBe("Continue to step 3");
    expect(continueLabel("ownership")).toBe("Continue to step 4");
  });

  /* Read off STEPS, so inserting or reordering a step cannot leave a button
     counting wrong — which is the only way this label goes bad, and it would
     go bad silently. */
  it("follows the order in STEPS rather than a number typed into the button", () => {
    STEPS.slice(0, -1).forEach((step, index) => {
      expect(continueLabel(step)).toBe(`Continue to step ${index + 2}`);
    });
  });

  it("has nowhere to send the last step, so it just says Continue", () => {
    expect(continueLabel("review")).toBe("Continue");
    expect(continueLabel("nonsense")).toBe("Continue");
  });
});
