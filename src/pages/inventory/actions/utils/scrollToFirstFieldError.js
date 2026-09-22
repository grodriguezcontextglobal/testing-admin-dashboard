import { FIELD_ERROR_ATTRIBUTE } from "./fieldError";

/**
 * Takes the page to the first thing stopping it.
 *
 * The other half of the same problem: the wizard's Continue sits at the bottom
 * of a long form and the mandatory fields are at the top, so a blocked step
 * looks exactly like a dead button. Fredrik reported one as broken (P1 `13:27`)
 * while its error was on screen, several screens above where he was looking.
 * Making the message bold does nothing for that on its own.
 *
 * Finding it by DOM order rather than by field name is deliberate: the first
 * error in the document is the first one on the page, whatever the form's field
 * order happens to be, and nothing has to keep a list of inputs in sync.
 */

/** The first rendered field error, or null. */
export const findFirstFieldError = (root) =>
  (root ?? (typeof document === "undefined" ? null : document))?.querySelector(
    `[${FIELD_ERROR_ATTRIBUTE}]`,
  ) ?? null;

/**
 * Scrolls the first field error into view.
 *
 * Runs on the next frame because the errors are rendered by the same state
 * update that decides the step is blocked — looking for them in the same tick
 * finds the previous render's, or nothing at all.
 *
 * @param {{root?: ParentNode, behavior?: ScrollBehavior}} [options]
 * @returns {boolean} whether there was one to scroll to. Callers use it to
 *   tell "blocked by a field" from "blocked by something with no field".
 */
export const scrollToFirstFieldError = ({ root, behavior = "smooth" } = {}) => {
  const target = findFirstFieldError(root);
  if (!target) return false;

  const run = () => {
    /* scrollIntoView is missing in happy-dom and in older browsers; the focus
       is the part that matters for a keyboard or a screen reader anyway. */
    target.scrollIntoView?.({ behavior, block: "center" });
  };

  if (typeof requestAnimationFrame === "function") requestAnimationFrame(run);
  else run();

  return true;
};

export default scrollToFirstFieldError;
