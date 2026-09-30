/**
 * Text typed into the sub-location field and not yet added with its button.
 *
 * Only the list of added sub-locations is saved, so this text is dropped when
 * the group is created — reported 2026-09-29 `20:25`. While it is not empty
 * the Location step waits: add it, or clear it.
 *
 * @param {unknown} value the field's current value
 * @returns {string} the pending text, trimmed; "" when nothing is pending
 */
export const pendingSubLocation = (value) => `${value ?? ""}`.trim();
