/**
 * The create-group wizard's steps, and what its buttons call them.
 *
 * Plain data with no imports on purpose: every step component reads the
 * label from here, and going through the hook instead would drag
 * useBulkActionLogic — the API clients, the queries, all of it — into a
 * component that only wanted a string.
 */

export const STEPS = ["details", "location", "ownership", "units", "review"];

/**
 * Which step this is, counting from 1 the way the progress bar does.
 * @returns {number|null} null for a key that is not a step.
 */
export const stepNumber = (step) => {
  const index = STEPS.indexOf(step);
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
 * > didn't pay attention to this… so I got confused. So I would say continue to
 * > step 2."
 * >
 * > P1 `29:11` — "you have to have some same that continues step one, step two,
 * > step three, step 4, step 5."
 *
 * The number is read off STEPS rather than written into each button, so
 * inserting or reordering a step cannot leave a button counting wrong — which
 * is the only way a label like this goes bad, and it goes bad silently.
 */
export const continueLabel = (step) => {
  const current = stepNumber(step);
  if (current === null || current >= STEPS.length) return "Continue";
  return `Continue to step ${current + 1}`;
};
