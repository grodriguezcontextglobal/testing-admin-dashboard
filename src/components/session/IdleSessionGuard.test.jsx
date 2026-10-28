import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const logout = vi.fn(async () => {});
vi.mock("../../hooks/useLogout", () => ({ default: () => logout }));

const { default: IdleSessionGuard } = await import("./IdleSessionGuard");

const MIN = 60 * 1000;
const START = new Date("2026-10-26T12:00:00Z").getTime();
const token = `x.${btoa(JSON.stringify({ iat: START / 1000 }))}.y`;

const advance = async (ms) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START);
  localStorage.clear();
  logout.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("IdleSessionGuard", () => {
  it("shows the warning with a countdown at 13 minutes", async () => {
    render(<IdleSessionGuard token={token} />);
    expect(screen.queryByText("Are you still there?")).toBeNull();
    await advance(13 * MIN);
    expect(screen.getByText("Are you still there?")).toBeTruthy();
    expect(screen.getByText("2:00")).toBeTruthy();
  });

  it("'Stay signed in' keeps the session", async () => {
    render(<IdleSessionGuard token={token} />);
    await advance(13 * MIN);
    fireEvent.click(screen.getByText("Stay signed in"));
    await advance(5 * MIN);
    expect(logout).not.toHaveBeenCalled();
  });

  it("signs out through useLogout at 15 minutes, then tells App", async () => {
    const onSignedOut = vi.fn();
    render(<IdleSessionGuard token={token} onSignedOut={onSignedOut} />);
    await advance(15 * MIN);
    expect(logout).toHaveBeenCalledTimes(1);
    expect(onSignedOut).toHaveBeenCalledTimes(1);
  });

  it("puts both buttons in one row, side by side", async () => {
    render(<IdleSessionGuard token={token} />);
    await advance(13 * MIN);
    const out = screen.getByText("Sign out").closest("button");
    const stay = screen.getByText("Stay signed in").closest("button");
    const row = out.parentElement;
    expect(stay.parentElement).toBe(row);
    expect(row.style.display).toBe("flex");
    expect(row.style.flexDirection).not.toBe("column");
  });

  it("'Sign out' ends the session at once", async () => {
    render(<IdleSessionGuard token={token} />);
    await advance(13 * MIN);
    fireEvent.click(screen.getByText("Sign out"));
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
