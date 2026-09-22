import { describe, expect, it } from "vitest";

import {
  STEPS,
  WIZARD_STEPS,
  continueLabel,
  reviewStepNotice,
  stepNumber,
} from "./wizardSteps";

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

/* Fredrik, part 1 `10:16`: "nothing will be added or completed until you have
   finished the review in step 5. That's what we probably should be saying."
   It used to say "until the last step" — true, and it tells nobody which one
   that is, while the bar right above it counts. */
describe("reviewStepNotice", () => {
  it("names the step the review is on", () => {
    expect(reviewStepNotice("created")).toBe(
      "Nothing is created until you finish the review in step 5."
    );
  });

  it("takes the verb from the caller, so the edit wizard can say saved", () => {
    expect(reviewStepNotice("saved")).toContain("Nothing is saved until");
  });

  /* Read off the list, so adding a step moves the sentence with it rather than
     leaving it pointing at a step that is no longer the last. */
  it("counts rather than repeating a number someone typed", () => {
    expect(reviewStepNotice("created")).toContain(`step ${STEPS.length}`);
    expect(reviewStepNotice("created")).toContain(`step ${stepNumber("review")}`);
  });
});

/* The progress bar and the navigation were two lists of the same five steps,
   kept in order by hand. One is derived from the other now. */
describe("WIZARD_STEPS", () => {
  it("is the list STEPS comes from, in the same order", () => {
    expect(WIZARD_STEPS.map((step) => step.key)).toEqual(STEPS);
  });

  it("gives every step something to show on the bar", () => {
    for (const step of WIZARD_STEPS) expect(step.label).toBeTruthy();
  });

  it("ends on the review, which is what the notice points at", () => {
    expect(WIZARD_STEPS.at(-1).key).toBe("review");
  });
});
