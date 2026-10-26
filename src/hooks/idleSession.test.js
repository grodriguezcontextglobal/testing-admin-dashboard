import { describe, expect, it } from "vitest";
import {
  IDLE_TIMEOUT_MS,
  IDLE_WARNING_MS,
  LAST_ACTIVITY_KEY,
  formatCountdown,
  sessionStartFromToken,
  idlePhase,
  initialActivity,
  readLastActivity,
} from "./idleSession";
import { SESSION_STORAGE_KEYS } from "../api/sessionHeaders";

// fedRAMP/FRONTEND_action_plan_2026-10-26.md, B1 (AC-11): a staff session
// ends after 15 minutes without activity, with a warning 2 minutes before.

const MIN = 60 * 1000;

describe("idle session timing", () => {
  it("is 15 minutes, warned 2 minutes before", () => {
    expect(IDLE_TIMEOUT_MS).toBe(15 * MIN);
    expect(IDLE_WARNING_MS).toBe(2 * MIN);
  });

  it("is active until the warning starts", () => {
    expect(idlePhase({ lastActivity: 0, now: 12 * MIN })).toEqual({ phase: "active", remainingMs: 3 * MIN });
  });

  it("warns during the last 2 minutes", () => {
    expect(idlePhase({ lastActivity: 0, now: 13 * MIN })).toEqual({ phase: "warning", remainingMs: 2 * MIN });
    expect(idlePhase({ lastActivity: 0, now: 14 * MIN + 59_000 }).phase).toBe("warning");
  });

  it("expires at 15 minutes and after", () => {
    expect(idlePhase({ lastActivity: 0, now: 15 * MIN })).toEqual({ phase: "expired", remainingMs: 0 });
    expect(idlePhase({ lastActivity: 0, now: 90 * MIN }).remainingMs).toBe(0);
  });
});

describe("initialActivity — what a page load starts from", () => {
  const sessionStartedAt = 1_000_000;

  it("keeps this session's last activity, even if it is already too old", () => {
    // Closing the tab is not activity: reopening it 20 minutes later ends the session.
    const stored = sessionStartedAt + 5 * MIN;
    expect(initialActivity({ stored, sessionStartedAt, now: stored + 20 * MIN })).toBe(stored);
  });

  it("ignores a timestamp left by an earlier session", () => {
    expect(initialActivity({ stored: sessionStartedAt - 1, sessionStartedAt, now: 5 })).toBe(5);
  });

  it("starts now when nothing is stored or the session start is unknown", () => {
    expect(initialActivity({ stored: null, sessionStartedAt, now: 7 })).toBe(7);
    expect(initialActivity({ stored: sessionStartedAt + 1, sessionStartedAt: null, now: 7 })).toBe(7);
  });
});

describe("readLastActivity", () => {
  it("reads a stored number, and nothing else", () => {
    expect(readLastActivity({ getItem: () => "123" })).toBe(123);
    expect(readLastActivity({ getItem: () => null })).toBeNull();
    expect(readLastActivity({ getItem: () => "abc" })).toBeNull();
    expect(readLastActivity({ getItem: () => { throw new Error("blocked"); } })).toBeNull();
  });

  it("is cleared with the rest of the session on logout", () => {
    expect(SESSION_STORAGE_KEYS).toContain(LAST_ACTIVITY_KEY);
  });
});

describe("formatCountdown", () => {
  it("shows minutes and seconds, rounding up", () => {
    expect(formatCountdown(2 * MIN)).toBe("2:00");
    expect(formatCountdown(61_001)).toBe("1:02");
    expect(formatCountdown(9_000)).toBe("0:09");
    expect(formatCountdown(0)).toBe("0:00");
    expect(formatCountdown(null)).toBe("0:00");
  });
});

describe("sessionStartFromToken", () => {
  // header.payload.signature, payload = {"iat":1761480000}
  const token = `x.${btoa(JSON.stringify({ iat: 1761480000 }))}.y`;

  it("reads the sign-in time from the JWT", () => {
    expect(sessionStartFromToken(token)).toBe(1761480000 * 1000);
  });

  it("is null for a missing or unreadable token", () => {
    expect(sessionStartFromToken(null)).toBeNull();
    expect(sessionStartFromToken("not-a-jwt")).toBeNull();
    expect(sessionStartFromToken(`x.${btoa("{}")}.y`)).toBeNull();
  });
});
