import { useCallback, useEffect, useRef, useState } from "react";
import {
  idlePhase,
  initialActivity,
  readLastActivity,
  writeLastActivity,
} from "./idleSession";

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "touchstart", "wheel", "scroll"];
// mousemove and scroll fire constantly; the shared clock needs no finer grain.
const WRITE_EVERY_MS = 5000;
const TICK_MS = 1000;

/**
 * The idle clock for a signed-in page (B1 · AC-11; rules in idleSession.js).
 *
 * Returns the phase ("active" | "warning" | "expired"), the time left, and
 * `staySignedIn`. While the warning shows, moving the mouse does not dismiss
 * it: the person has to answer it. `onTimeout` runs once.
 *
 * @param {{ onTimeout: () => void, sessionStartedAt: number | null }} args
 */
const useIdleSession = ({ onTimeout, sessionStartedAt }) => {
  const [state, setState] = useState({ phase: "active", remainingMs: null });
  const lastWrite = useRef(0);
  const timedOut = useRef(false);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const markActivity = useCallback(() => {
    const now = Date.now();
    writeLastActivity(localStorage, now);
    lastWrite.current = now;
  }, []);

  useEffect(() => {
    const now = Date.now();
    const start = initialActivity({ stored: readLastActivity(localStorage), sessionStartedAt, now });
    writeLastActivity(localStorage, start);
    lastWrite.current = start;

    const current = () =>
      idlePhase({ lastActivity: readLastActivity(localStorage) ?? lastWrite.current, now: Date.now() });

    const onActivity = () => {
      if (Date.now() - lastWrite.current < WRITE_EVERY_MS) return;
      if (current().phase !== "active") return;
      markActivity();
    };

    const tick = () => {
      const next = current();
      setState((prev) =>
        prev.phase === next.phase && prev.remainingMs === next.remainingMs ? prev : next
      );
      if (next.phase === "expired" && !timedOut.current) {
        timedOut.current = true;
        onTimeoutRef.current?.();
      }
    };

    ACTIVITY_EVENTS.forEach((type) => window.addEventListener(type, onActivity, { passive: true }));
    const interval = setInterval(tick, TICK_MS);
    tick();
    return () => {
      ACTIVITY_EVENTS.forEach((type) => window.removeEventListener(type, onActivity));
      clearInterval(interval);
    };
  }, [sessionStartedAt, markActivity]);

  const staySignedIn = useCallback(() => {
    markActivity();
    setState(idlePhase({ lastActivity: Date.now(), now: Date.now() }));
  }, [markActivity]);

  return { ...state, staySignedIn };
};

export default useIdleSession;
