/*
 * Pinned under a timezone west of UTC, because that is the only place the bug
 * this covers ever showed: `new Date("2026-08-28")` is UTC midnight, which is
 * 8pm on the 27th in New York.
 */
/* global process */
process.env.TZ = "America/New_York";

import { describe, expect, it } from "vitest";
import {
  calendarWeekday,
  formatCalendarDay,
  parseCalendarDay,
} from "./dateUtils";

describe("the timezone this file is pinned to", () => {
  it("is west of UTC, or these tests prove nothing", () => {
    // If this ever stops holding, the assertions below pass for the wrong
    // reason — under UTC the broken code produced the right answer too.
    expect(new Date("2026-08-28").getDate()).toBe(27);
  });
});

describe("parseCalendarDay", () => {
  it("reads the parts out of the string, with no Date in between", () => {
    expect(parseCalendarDay("2026-08-28")).toEqual({ year: 2026, month: 8, day: 28 });
  });

  it("accepts the unpadded form the search modal writes", () => {
    expect(parseCalendarDay("2026-8-1")).toEqual({ year: 2026, month: 8, day: 1 });
  });

  it("takes the calendar day out of a timestamp", () => {
    expect(parseCalendarDay("2026-08-28T00:00:00.000Z")).toEqual({
      year: 2026,
      month: 8,
      day: 28,
    });
  });

  it("is null for anything that is not a date", () => {
    expect(parseCalendarDay("not a date")).toBeNull();
    expect(parseCalendarDay("")).toBeNull();
    expect(parseCalendarDay(undefined)).toBeNull();
    expect(parseCalendarDay(null)).toBeNull();
  });
});

describe("formatCalendarDay", () => {
  const short = { month: "short", day: "numeric" };
  const long = { year: "numeric", month: "long", day: "numeric" };

  it("renders the day that was asked for, not the one before it", () => {
    // The reported bug: a window of Aug 28 – Sep 2 drew an axis reading
    // Aug 27 … Sep 1.
    expect(formatCalendarDay("2026-08-28", short, "en-US")).toBe("Aug 28");
    expect(formatCalendarDay("2026-09-02", short, "en-US")).toBe("Sep 2");
  });

  it("draws the whole reported window on its own days", () => {
    const window = [
      "2026-08-28",
      "2026-08-29",
      "2026-08-30",
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
    ];
    expect(window.map((day) => formatCalendarDay(day, short, "en-US"))).toEqual([
      "Aug 28",
      "Aug 29",
      "Aug 30",
      "Aug 31",
      "Sep 1",
      "Sep 2",
    ]);
  });

  it("does not roll a first-of-month back into the previous month", () => {
    expect(formatCalendarDay("2026-09-01", short, "en-US")).toBe("Sep 1");
    expect(formatCalendarDay("2027-01-01", long, "en-US")).toBe("January 1, 2027");
  });

  it("honours whatever options it is handed", () => {
    expect(formatCalendarDay("2026-08-28", long, "en-US")).toBe("August 28, 2026");
  });

  it("keeps the calendar day of a timestamp", () => {
    expect(formatCalendarDay("2026-08-28T00:00:00.000Z", short, "en-US")).toBe("Aug 28");
  });

  it("returns the input untouched when it is not a date", () => {
    expect(formatCalendarDay("not a date", short, "en-US")).toBe("not a date");
    expect(formatCalendarDay(undefined, short, "en-US")).toBe("");
  });
});

describe("calendarWeekday", () => {
  it("reads the weekday off the calendar day, not off a local clock", () => {
    // Aug 28 2026 is a Friday. `new Date("2026-08-28").getDay()` west of UTC
    // answers Thursday, which is how weekend shading landed a day out.
    expect(calendarWeekday("2026-08-28")).toBe(5);
    expect(calendarWeekday("2026-08-29")).toBe(6); // Saturday
    expect(calendarWeekday("2026-08-30")).toBe(0); // Sunday
  });

  it("is null for anything that is not a date", () => {
    expect(calendarWeekday("not a date")).toBeNull();
    expect(calendarWeekday(undefined)).toBeNull();
  });
});
