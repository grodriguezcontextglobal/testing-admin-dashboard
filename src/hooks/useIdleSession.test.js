import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LAST_ACTIVITY_KEY } from "./idleSession";
import useIdleSession from "./useIdleSession";

const MIN = 60 * 1000;
const START = new Date("2026-10-26T12:00:00Z").getTime();

const advance = (ms) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START);
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe("useIdleSession", () => {
  it("warns at 13 minutes and signs out at 15, once", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useIdleSession({ onTimeout, sessionStartedAt: START }));
    expect(result.current.phase).toBe("active");

    advance(13 * MIN);
    expect(result.current.phase).toBe("warning");
    expect(result.current.remainingMs).toBe(2 * MIN);

    advance(2 * MIN);
    expect(onTimeout).toHaveBeenCalledTimes(1);
    advance(5 * MIN);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("activity restarts the clock", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useIdleSession({ onTimeout, sessionStartedAt: START }));
    advance(10 * MIN);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown"));
    });
    advance(10 * MIN);
    expect(result.current.phase).toBe("active");
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("once the warning shows, only 'Stay signed in' restarts the clock", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useIdleSession({ onTimeout, sessionStartedAt: START }));
    advance(13 * MIN);
    act(() => {
      window.dispatchEvent(new MouseEvent("mousedown"));
    });
    advance(1000);
    expect(result.current.phase).toBe("warning");

    act(() => result.current.staySignedIn());
    expect(result.current.phase).toBe("active");
    advance(14 * MIN);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("activity in another tab keeps this one signed in", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useIdleSession({ onTimeout, sessionStartedAt: START }));
    advance(13 * MIN);
    expect(result.current.phase).toBe("warning");
    // Another tab writes the shared clock.
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    advance(1000);
    expect(result.current.phase).toBe("active");
  });

  it("a page opened after 15 idle minutes of this session signs out straight away", () => {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(START));
    vi.setSystemTime(START + 20 * MIN);
    const onTimeout = vi.fn();
    renderHook(() => useIdleSession({ onTimeout, sessionStartedAt: START }));
    advance(1000);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("a timestamp from an earlier session does not sign the new one out", () => {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(START - 60 * MIN));
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useIdleSession({ onTimeout, sessionStartedAt: START }));
    advance(1000);
    expect(onTimeout).not.toHaveBeenCalled();
    expect(result.current.phase).toBe("active");
  });

  it("stops listening when unmounted", () => {
    const onTimeout = vi.fn();
    const { unmount } = renderHook(() => useIdleSession({ onTimeout, sessionStartedAt: START }));
    unmount();
    advance(20 * MIN);
    expect(onTimeout).not.toHaveBeenCalled();
  });
});
