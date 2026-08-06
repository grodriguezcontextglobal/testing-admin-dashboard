import { describe, expect, it } from "vitest";
import {
  calendarDaysUntil,
  formatLoanDate,
  formatRelativeDay,
  getLoanStatus,
  summarizeLoans,
  startOfLocalDay,
  toDate,
} from "./loanStatus";

// Fixed "now" so the suite doesn't drift. Local noon avoids any chance of the
// test itself straddling a local midnight.
const NOW = new Date(2026, 7, 4, 12, 0, 0); // Aug 4, 2026, local

describe("toDate", () => {
  it("returns null for empty and unparseable values", () => {
    expect(toDate(null)).toBeNull();
    expect(toDate(undefined)).toBeNull();
    expect(toDate("")).toBeNull();
    expect(toDate("not a date")).toBeNull();
  });

  it("passes Date instances through", () => {
    const d = new Date(2026, 0, 1);
    expect(toDate(d)).toBe(d);
  });
});

describe("calendarDaysUntil", () => {
  it("counts whole local calendar days regardless of time of day", () => {
    // Late-evening timestamp on Aug 3 is still "yesterday", not -0.
    expect(calendarDaysUntil(new Date(2026, 7, 3, 23, 59), NOW)).toBe(-1);
    expect(calendarDaysUntil(new Date(2026, 7, 4, 0, 1), NOW)).toBe(0);
    expect(calendarDaysUntil(new Date(2026, 7, 8, 6, 0), NOW)).toBe(4);
  });

  it("returns null when the value can't be parsed", () => {
    expect(calendarDaysUntil(null, NOW)).toBeNull();
    expect(calendarDaysUntil("nope", NOW)).toBeNull();
  });
});

describe("startOfLocalDay", () => {
  it("strips the time component", () => {
    const result = startOfLocalDay(new Date(2026, 7, 4, 18, 30));
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getDate()).toBe(4);
  });
});

describe("formatLoanDate", () => {
  it("renders a readable local date rather than an ISO string", () => {
    const formatted = formatLoanDate(new Date(2026, 5, 20, 14, 0));
    expect(formatted).not.toMatch(/T\d{2}:\d{2}/);
    expect(formatted).toMatch(/2026/);
    expect(formatted).toMatch(/20/);
  });

  it("returns null when there is nothing to show", () => {
    expect(formatLoanDate(null)).toBeNull();
    expect(formatLoanDate("garbage")).toBeNull();
  });
});

describe("formatRelativeDay", () => {
  it("uses words for the near days", () => {
    expect(formatRelativeDay(new Date(2026, 7, 4, 9, 0), NOW)).toBe("today");
    expect(formatRelativeDay(new Date(2026, 7, 5, 9, 0), NOW)).toBe("tomorrow");
    expect(formatRelativeDay(new Date(2026, 7, 3, 9, 0), NOW)).toBe("yesterday");
  });

  it("counts days in both directions", () => {
    expect(formatRelativeDay(new Date(2026, 7, 8), NOW)).toBe("in 4 days");
    expect(formatRelativeDay(new Date(2026, 6, 3), NOW)).toBe("32 days ago");
  });
});

describe("getLoanStatus", () => {
  it("flags the overdue Chromebook from the member profile", () => {
    // The real record: assigned Jun 20, due Jul 3, still out on Aug 4.
    const status = getLoanStatus(
      { expectedReturnDate: "2026-07-03T22:48:24.000Z" },
      NOW
    );
    expect(status.key).toBe("overdue");
    expect(status.tone).toBe("critical");
    expect(status.label).toMatch(/^Overdue \d+d$/);
    expect(status.days).toBeLessThan(0);
  });

  it("treats a returned device as resolved even when it is past due", () => {
    const status = getLoanStatus(
      {
        expectedReturnDate: new Date(2026, 6, 3),
        returnedDate: new Date(2026, 6, 10),
      },
      NOW
    );
    expect(status.key).toBe("returned");
    expect(status.tone).toBe("success");
  });

  it("warns inside the due-soon window and stays neutral outside it", () => {
    expect(getLoanStatus({ expectedReturnDate: new Date(2026, 7, 8) }, NOW).key).toBe(
      "due-soon"
    );
    expect(getLoanStatus({ expectedReturnDate: new Date(2026, 7, 20) }, NOW).key).toBe(
      "on-loan"
    );
  });

  it("names the boundary days instead of showing 'Due in 0d'", () => {
    expect(getLoanStatus({ expectedReturnDate: new Date(2026, 7, 4) }, NOW).label).toBe(
      "Due today"
    );
    expect(getLoanStatus({ expectedReturnDate: new Date(2026, 7, 5) }, NOW).label).toBe(
      "Due tomorrow"
    );
  });

  it("respects a custom due-soon window", () => {
    const args = { expectedReturnDate: new Date(2026, 7, 10), dueSoonDays: 2 };
    expect(getLoanStatus(args, NOW).key).toBe("on-loan");
    expect(getLoanStatus({ ...args, dueSoonDays: 10 }, NOW).key).toBe("due-soon");
  });

  it("falls back to 'On loan' when no due date was ever set", () => {
    const status = getLoanStatus({ expectedReturnDate: null }, NOW);
    expect(status.key).toBe("on-loan");
    expect(status.tone).toBe("neutral");
    expect(status.days).toBeNull();
  });

  it("survives being called with nothing", () => {
    expect(getLoanStatus().key).toBe("on-loan");
  });
});

describe("summarizeLoans", () => {
  const pick = (row) => ({
    expectedReturnDate: row.expected_return_date,
    returnedDate: row.returned_date,
  });

  const rows = [
    { expected_return_date: new Date(2026, 6, 3) }, // 32 days overdue
    { expected_return_date: new Date(2026, 6, 20) }, // 15 days overdue
    { expected_return_date: new Date(2026, 7, 8) }, // due in 4
    { expected_return_date: new Date(2026, 11, 19) }, // on loan
    { expected_return_date: new Date(2026, 5, 1), returned_date: new Date(2026, 5, 2) },
  ];

  it("counts what the stat tiles show", () => {
    const summary = summarizeLoans(rows, pick, NOW);
    expect(summary.total).toBe(5);
    expect(summary.out).toBe(4);
    expect(summary.overdue).toBe(2);
    expect(summary.dueSoon).toBe(1);
    expect(summary.returned).toBe(1);
  });

  it("reports the longest overdue run, not the most recent", () => {
    expect(summarizeLoans(rows, pick, NOW).longestOverdueDays).toBe(32);
  });

  it("picks the soonest upcoming due date", () => {
    expect(summarizeLoans(rows, pick, NOW).nextDue.days).toBe(4);
  });

  it("handles an empty or missing list", () => {
    expect(summarizeLoans([], pick, NOW).total).toBe(0);
    expect(summarizeLoans(undefined, pick, NOW).out).toBe(0);
    expect(summarizeLoans([], pick, NOW).nextDue).toBeNull();
  });
});
