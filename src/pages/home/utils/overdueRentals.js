/**
 * Whether any rented item is past its return date — the home page's
 * "leased equipment" banner. An item with no valid return date is not
 * overdue.
 */
export const hasOverdueRentals = (items, now = Date.now()) =>
  (items ?? []).some((item) => {
    if (String(item?.ownership).toLowerCase() !== "rent") return false;
    const returnTime = new Date(`${item?.return_date}`).getTime();
    return Number.isFinite(returnTime) && returnTime < now;
  });
