import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  RETURN_PATH_KEY,
  handleUnauthorized,
  isSessionExpiry,
  returnPathFrom,
  sessionEndedNotice,
  setSessionExpiredHandler,
  takeReturnPath,
} from "./sessionExpiry";

/* 2026-10-19, BACKEND_fedramp_server_tasks_REPLY_2026-10-19.md: the server now
   answers 401 on routes that used to be anonymous. With an expired session a
   screen loaded half its data and broke on the rest, because nothing handled
   a 401 globally. An authenticated request that comes back 401 now ends the
   session and sends the person to /login, to come back where they were. */
const expired = (overrides = {}) => ({
  status: 401,
  requestPath: "/api/db_lease/consulting-lease",
  hadToken: true,
  hasToken: true,
  pathname: "/inventory/item",
  ...overrides,
});

describe("isSessionExpiry", () => {
  it("an authenticated request answered 401 on a private page is an expired session", () => {
    expect(isSessionExpiry(expired())).toBe(true);
  });

  it("anything other than 401 is not", () => {
    for (const status of [400, 403, 404, 500, undefined]) {
      expect(isSessionExpiry(expired({ status }))).toBe(false);
    }
  });

  it("a request sent without a token had no session to expire", () => {
    expect(isSessionExpiry(expired({ hadToken: false }))).toBe(false);
  });

  /* The first 401 clears the token; the requests still in flight must not end
     the session a second time. */
  it("once the session is gone, the other 401s in flight are ignored", () => {
    expect(isSessionExpiry(expired({ hasToken: false }))).toBe(false);
  });

  it("sign-in, MFA, password and other flows that answer 401 on purpose keep their own handling", () => {
    for (const requestPath of [
      "/api/admin/login",
      "/api/admin/logout",
      "/api/admin/mfa/verify",
      "/api/admin/mfa/generate",
      "/api/admin/verify-password",
      "/api/admin/update-password",
      "/api/staff/force-logout",
      "/api/registration/accept-invitation",
      "/api/school/event-invitations/confirm",
      "/api/school/consent/respond",
      "/api/db_member/my-devices",
    ]) {
      expect(isSessionExpiry(expired({ requestPath }))).toBe(false);
    }
  });

  it("public pages keep their own handling, even with a staff session in the browser", () => {
    for (const pathname of [
      "/login",
      "/receipt",
      "/attendance-confirmation",
      "/display-contracts",
      "/school/consent/respond",
      "/my-devices",
      "/status",
      "/reset-password",
      "/invitation",
      "/register/company-setup",
    ]) {
      expect(isSessionExpiry(expired({ pathname }))).toBe(false);
    }
  });
});

describe("returnPathFrom", () => {
  it("keeps the page and its query", () => {
    expect(returnPathFrom({ pathname: "/member/12/main", search: "?tab=devices" })).toBe(
      "/member/12/main?tab=devices"
    );
  });

  it("never returns somewhere outside the app, or to a public page", () => {
    expect(returnPathFrom({ pathname: "//evil.example", search: "" })).toBeNull();
    expect(returnPathFrom({ pathname: "https://evil.example", search: "" })).toBeNull();
    expect(returnPathFrom({ pathname: "/login", search: "" })).toBeNull();
    expect(returnPathFrom({ pathname: "/", search: "" })).toBeNull();
  });
});

describe("handleUnauthorized and takeReturnPath", () => {
  const error = (status, token = "jwt") => ({
    response: { status },
    config: { baseURL: "https://api.devitrak.net/api", url: "/db_lease/consulting-lease", headers: { "x-token": token } },
  });

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.setItem("admin-token", "jwt");
    window.history.replaceState({}, "", "/inventory/item?serial=SN-1");
  });

  afterEach(() => {
    setSessionExpiredHandler(null);
    localStorage.clear();
    sessionStorage.clear();
  });

  it("calls the registered handler once and remembers where the person was", () => {
    const handler = vi.fn(() => localStorage.removeItem("admin-token"));
    setSessionExpiredHandler(handler);

    handleUnauthorized(error(401));
    handleUnauthorized(error(401));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(takeReturnPath()).toBe("/inventory/item?serial=SN-1");
    // Read once: a later sign-in goes to the home page.
    expect(takeReturnPath()).toBeNull();
  });

  it("does nothing for a 403", () => {
    const handler = vi.fn();
    setSessionExpiredHandler(handler);
    handleUnauthorized(error(403));
    expect(handler).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(RETURN_PATH_KEY)).toBeNull();
  });

  it("does not throw when nothing is registered", () => {
    expect(() => handleUnauthorized(error(401))).not.toThrow();
  });

  it("ignores a stored path that is not safe", () => {
    sessionStorage.setItem(RETURN_PATH_KEY, "//evil.example");
    expect(takeReturnPath()).toBeNull();
  });

  it("tells the handler why the server ended the session", () => {
    const handler = vi.fn();
    setSessionExpiredHandler(handler);
    const idle = error(401);
    idle.response.data = { ok: false, sessionEnded: true, reason: "idle" };
    handleUnauthorized(idle);
    expect(handler).toHaveBeenCalledWith(sessionEndedNotice({ reason: "idle" }));
  });
});

/* 2026-10-27, FRONTEND_fedramp_a6_server_sessions (AC-12): the server ends
   sessions too, and its 401 says why in `reason`. */
describe("sessionEndedNotice", () => {
  it("says the session closed for inactivity", () => {
    expect(sessionEndedNotice({ sessionEnded: true, reason: "idle" }).title).toMatch(/inactivity/i);
  });

  it("says the session was closed from somewhere else", () => {
    expect(sessionEndedNotice({ sessionEnded: true, reason: "revoked" }).title).toMatch(/elsewhere/i);
  });

  it("falls back to the plain expiry notice for anything else", () => {
    const plain = sessionEndedNotice(undefined);
    expect(plain.title).toBe("Your session has expired");
    expect(sessionEndedNotice({ reason: "no_sid" })).toEqual(plain);
    expect(sessionEndedNotice("<html>")).toEqual(plain);
  });

  it("always asks to sign in again", () => {
    ["idle", "revoked", "no_sid"].forEach((reason) =>
      expect(sessionEndedNotice({ reason }).description).toMatch(/sign in again/i)
    );
  });
});
