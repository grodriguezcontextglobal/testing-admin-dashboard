/**
 * Ending a staff session after inactivity
 * (fedRAMP/FRONTEND_action_plan_2026-10-26.md, B1 · AC-11).
 *
 * 15 minutes is the FedRAMP Moderate value. The last activity lives in
 * localStorage so every open tab shares it: working in one tab keeps the
 * others signed in, and all of them warn and end together.
 */

import { jwtDecode } from "jwt-decode";

export const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
export const IDLE_WARNING_MS = 2 * 60 * 1000;
// Also listed in SESSION_STORAGE_KEYS (api/sessionHeaders.js): logout clears it.
export const LAST_ACTIVITY_KEY = "devitrak-last-activity";

export const readLastActivity = (storage) => {
  try {
    const value = Number(storage.getItem(LAST_ACTIVITY_KEY));
    return storage.getItem(LAST_ACTIVITY_KEY) !== null && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
};

export const writeLastActivity = (storage, at) => {
  try {
    storage.setItem(LAST_ACTIVITY_KEY, String(at));
  } catch {
    // Private mode or blocked storage: the timer still runs in this tab.
  }
};

export const idlePhase = ({ lastActivity, now, timeoutMs = IDLE_TIMEOUT_MS, warningMs = IDLE_WARNING_MS }) => {
  const remainingMs = Math.max(0, lastActivity + timeoutMs - now);
  if (remainingMs === 0) return { phase: "expired", remainingMs };
  if (remainingMs <= warningMs) return { phase: "warning", remainingMs };
  return { phase: "active", remainingMs };
};

/**
 * Where the clock starts on page load. A timestamp written during this
 * session is kept, so closing the tab and coming back later does not count as
 * activity. One older than the session's start belongs to an earlier sign-in
 * and is ignored.
 */
export const initialActivity = ({ stored, sessionStartedAt, now }) =>
  stored !== null && sessionStartedAt && stored >= sessionStartedAt ? stored : now;

/** "m:ss" for the warning's countdown. */
export const formatCountdown = (ms) => {
  const seconds = Math.max(0, Math.ceil((Number(ms) || 0) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

/** When this sign-in happened: the session JWT's `iat`, in milliseconds. */
export const sessionStartFromToken = (token) => {
  try {
    const { iat } = jwtDecode(token);
    return Number.isFinite(iat) ? iat * 1000 : null;
  } catch {
    return null;
  }
};
