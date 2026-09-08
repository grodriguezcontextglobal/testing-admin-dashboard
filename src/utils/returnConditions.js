/**
 * The condition a device comes back in.
 *
 * The value is a server contract: it is sent verbatim as `status` to
 * /db_event/returning-item and stored on the lease, so it cannot be reworded.
 * The label is what the operator reads, and it is the half that was wrong.
 *
 * Two findings from the product review. "None" sat at the top of the list as if
 * it were a condition; it is not, it is an empty field with a name on it, and
 * choosing it left the form unable to submit. And a bare "Network" or
 * "Hardware" tells nobody what it means — asked outright what Network was
 * supposed to say about a returned device, nobody could answer from the word.
 *
 * Each label leads with its own value so the list still reads alphabetically
 * down the same column, and so a row stored before this file existed still
 * renders as itself.
 */
export const RETURN_CONDITIONS = Object.freeze([
  { value: "Operational", label: "Operational — works as expected" },
  { value: "Network", label: "Network — will not connect" },
  { value: "Hardware", label: "Hardware — a part has failed" },
  { value: "Damaged", label: "Damaged — physical damage" },
  { value: "Battery", label: "Battery — will not hold a charge" },
]);

/** The stored values, in order. */
export const conditionValues = () =>
  RETURN_CONDITIONS.map((option) => option.value);

/**
 * What to show for a stored condition.
 *
 * An unrecognised value is handed back untouched rather than blanked: history
 * written before this list existed is still history, and a row that renders
 * empty reads as "no condition recorded", which would be a lie.
 */
export const conditionLabel = (value) => {
  const stored = `${value ?? ""}`;
  return (
    RETURN_CONDITIONS.find((option) => option.value === stored)?.label ?? stored
  );
};
