/**
 * What a wizard's steps are called, and how its buttons and notices count them.
 *
 * Two wizards need this — adding inventory has five steps, updating it has four
 * — and they need it to behave identically, because a person who learns one
 * reads the other the same way. Written once and given the list, rather than
 * copied and kept in sync by hand, which is the failure this file exists to
 * avoid everywhere else.
 *
 * Plain data and closures, no imports: a step component reads a label from here
 * and must not drag a hook's API clients in behind it.
 */

/**
 * @param {Array<{key: string, label: string}>} steps - in order, as the
 *   progress bar shows them.
 */
export const createWizardSteps = (steps) => {
  const WIZARD_STEPS = steps;

  /** Just the keys, which is what the navigation works in. */
  const STEPS = steps.map((step) => step.key);

  /**
   * Which step this is, counting from 1 the way the progress bar does.
   * @returns {number|null} null for a key that is not a step.
   */
  const stepNumber = (key) => {
    const index = STEPS.indexOf(key);
    return index < 0 ? null : index + 1;
  };

  /**
   * What the button that leaves a step should say.
   *
   * It used to name the destination — "Continue to location", "Continue to
   * ownership" — which reads as a different kind of thing from the numbered
   * progress bar right above it:
   *
   * > P1 `13:15` — "Continue to step 2, to continue to location, that's like I
   * > didn't pay attention to this… so I got confused. So I would say continue
   * > to step 2."
   * >
   * > P1 `29:11` — "you have to have some same that continues step one, step
   * > two, step three, step 4, step 5."
   *
   * The number is read off the list rather than written into each button, so
   * inserting or reordering a step cannot leave a button counting wrong — which
   * is the only way a label like this goes bad, and it goes bad silently.
   */
  const continueLabel = (key) => {
    const current = stepNumber(key);
    if (current === null || current >= STEPS.length) return "Continue";
    return `Continue to step ${current + 1}`;
  };

  /**
   * Where the work actually happens, said with the number on the progress bar.
   *
   * > P1 `10:16` — "nothing will be added or completed until you have finished
   * > the review in step 5. That's what we probably should be saying."
   *
   * It used to say "until the last step", which is true and tells nobody which
   * one that is. Each wizard counts its own: five steps in one, four in the
   * other.
   *
   * @param {string} verb - what does not happen yet: "created", "saved".
   */
  const reviewStepNotice = (verb) =>
    `Nothing is ${verb} until you finish the review in step ${stepNumber("review")}.`;

  return { WIZARD_STEPS, STEPS, stepNumber, continueLabel, reviewStepNotice };
};
