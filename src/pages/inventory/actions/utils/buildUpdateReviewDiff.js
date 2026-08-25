/**
 * The review step's diff table: which tracked fields the form actually
 * changed from what the matched group has today, so "Apply" shows exactly
 * what moves instead of re-stating every field the payload happens to carry.
 */
import { TRACKED_FIELDS } from "./updateInventoryMatchSummary";

const normalize = (value) =>
  value === undefined || value === null ? "" : String(value).trim();

/**
 * @param {object} summaryFields - the `fields` map from summarizeInventoryMatches().
 * @param {object} formValues - the wizard form's current values, same field names.
 * @param {Array<{field: string, label: string}>} fieldsToCompare
 * @returns {Array<{field: string, label: string, from: *, to: *}>} only the
 *   fields whose value actually differs from the group's representative value.
 */
export const buildUpdateReviewDiff = (
  summaryFields = {},
  formValues = {},
  fieldsToCompare = TRACKED_FIELDS,
) => {
  const diff = [];
  fieldsToCompare.forEach(({ field, label }) => {
    const before = summaryFields?.[field]?.value ?? null;
    const after = formValues?.[field] ?? null;
    if (normalize(before) !== normalize(after)) {
      diff.push({ field, label, from: before, to: after });
    }
  });
  return diff;
};
