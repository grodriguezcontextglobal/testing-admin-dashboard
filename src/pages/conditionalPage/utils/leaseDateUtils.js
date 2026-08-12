/**
 * Date handling for member leases (school vertical).
 *
 * Exists because of one bug seen in manual testing: staff picked a due date and
 * the device was assigned with the day BEFORE it. `<Input type="date">` yields a
 * date-only string ("2026-08-20"), `new Date("2026-08-20")` is specified to parse
 * that as midnight UTC, and `formatDate` then reads LOCAL components — so at
 * UTC-4 the stored value was "2026-08-19 20:00:00".
 *
 * The trap is that the two halves are each defensible on their own; only the
 * combination loses a day, and only west of Greenwich. In a UTC container
 * (and in every test that does not pin a timezone) it looks perfectly fine.
 */

/** Date-only input values: exactly what `<input type="date">` produces. */
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Interprets a form date value as a real point in time in the user's timezone.
 *
 * A date with no time is midnight LOCAL, because that is what the person picking
 * it meant. Anything that already carries a time is left alone — there is no
 * ambiguity to resolve there.
 *
 * @param {string|Date|null|undefined} value
 * @returns {Date|null} null for anything unusable, never an Invalid Date
 */
export const parseDateInputValue = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const raw = `${value ?? ""}`.trim();
  if (!raw) return null;

  const dateOnly = DATE_ONLY.exec(raw);
  if (dateOnly) {
    const [, year, month, day] = dateOnly.map(Number);
    const parsed = new Date(year, month - 1, day);
    // The local constructor rolls overflow forward in silence: Feb 31 becomes
    // Mar 3. A due date the user never chose is worse than no due date, so the
    // round trip is checked instead of trusted.
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) {
      return null;
    }
    return parsed;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Today as `<input type="date">` wants it: YYYY-MM-DD, local day.
 *
 * The default used to be a full "YYYY-MM-DD HH:mm:ss" stamp, which a date input
 * rejects outright — so the field rendered blank and the "default due date" was
 * only ever a default in the form state, never on screen.
 *
 * @param {Date} [now]
 * @returns {string}
 */
export const todayDateInputValue = (now = new Date()) => {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
