/**
 * Loan status + date presentation for profile pages.
 *
 * The API hands us UTC ISO strings ("2026-07-03T22:48:24.000Z"). Rendering them
 * raw was the old behaviour: unreadable, and silently in the wrong timezone.
 * Everything here converts to the viewer's local calendar day first, then
 * compares — so "due today" means today where the user is sitting.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parse anything date-ish into a Date, or null when it isn't one. */
export function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Local midnight for a date — the basis for calendar-day math. */
export function startOfLocalDay(value) {
  const date = toDate(value);
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Whole calendar days from `now` to `value`, in local time.
 * Negative = in the past. Null when either side is unparseable.
 */
export function calendarDaysUntil(value, now = new Date()) {
  const target = startOfLocalDay(value);
  const today = startOfLocalDay(now);
  if (!target || !today) return null;
  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

/** "Jun 20, 2026" — the readable form that goes in the cell. */
export function formatLoanDate(value) {
  const date = toDate(value);
  if (!date) return null;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "Jun 20, 2026, 2:00 PM" — the exact form that goes in the tooltip. */
export function formatLoanDateTime(value) {
  const date = toDate(value);
  if (!date) return null;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "32 days ago" / "in 4 days" / "today" — the secondary line under a date. */
export function formatRelativeDay(value, now = new Date()) {
  const days = calendarDaysUntil(value, now);
  if (days === null) return null;
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 0) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}

/**
 * Classify a loan.
 *
 * tone drives colour and is deliberately semantic, never decorative:
 *   critical = needs action now, warning = needs action soon,
 *   success  = resolved,         neutral = nothing to do.
 */
export function getLoanStatus(
  { expectedReturnDate, returnedDate, dueSoonDays = 7 } = {},
  now = new Date()
) {
  if (returnedDate) {
    return {
      key: "returned",
      tone: "success",
      label: "Returned",
      days: null,
    };
  }

  const days = calendarDaysUntil(expectedReturnDate, now);

  if (days === null) {
    return { key: "on-loan", tone: "neutral", label: "On loan", days: null };
  }

  if (days < 0) {
    const overdueBy = Math.abs(days);
    return {
      key: "overdue",
      tone: "critical",
      label: `Overdue ${overdueBy}d`,
      days,
    };
  }

  if (days <= dueSoonDays) {
    const label =
      days === 0 ? "Due today" : days === 1 ? "Due tomorrow" : `Due in ${days}d`;
    return { key: "due-soon", tone: "warning", label, days };
  }

  return { key: "on-loan", tone: "neutral", label: "On loan", days };
}

/**
 * Roll a list of loans into the numbers the stat tiles show.
 * `pick` maps a raw row onto { expectedReturnDate, returnedDate }.
 */
export function summarizeLoans(rows, pick, now = new Date()) {
  const list = Array.isArray(rows) ? rows : [];
  const summary = {
    total: 0,
    out: 0,
    overdue: 0,
    dueSoon: 0,
    returned: 0,
    longestOverdueDays: 0,
    nextDue: null,
  };

  list.forEach((row) => {
    const status = getLoanStatus(pick(row), now);
    summary.total += 1;

    if (status.key === "returned") {
      summary.returned += 1;
      return;
    }

    summary.out += 1;

    if (status.key === "overdue") {
      summary.overdue += 1;
      summary.longestOverdueDays = Math.max(
        summary.longestOverdueDays,
        Math.abs(status.days)
      );
      return;
    }

    if (status.key === "due-soon") summary.dueSoon += 1;

    if (status.days !== null) {
      const due = pick(row).expectedReturnDate;
      if (summary.nextDue === null || status.days < summary.nextDue.days) {
        summary.nextDue = { days: status.days, date: due };
      }
    }
  });

  return summary;
}
