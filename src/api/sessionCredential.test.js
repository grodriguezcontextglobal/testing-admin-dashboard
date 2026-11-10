import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CSRF_FIELD,
  CSRF_HEADER,
  CSRF_KEY,
  SESSION_CLAIMS_KEY,
  TOKEN_KEY,
  attachSession,
  hasSession,
  isSessionValid,
  preSessionHeaders,
  readSessionClaims,
  readSessionMarker,
  requestCarriedSession,
  storeSession,
} from "./sessionCredential";
import { SESSION_STORAGE_KEYS } from "./sessionHeaders";

// GovRAMP #12 (SC-23, AC-12; decision D6). The session token leaves
// localStorage once the server sets an HttpOnly cookie (its phase 1). Behind
// VITE_APP_COOKIE_SESSION, off by default: with it off nothing changes.
// Contract from the backend reply of 2026-11-04 §1.1: the cookie is set on
// /admin/login and /admin/renew, the CSRF token comes in the login body and
// goes back as X-CSRF-Token on cookie-authenticated writes.

const memoryStorage = (initial = {}) => {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
    removeItem: (key) => {
      delete data[key];
    },
    data,
  };
};

const b64url = (value) =>
  btoa(JSON.stringify(value)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
const jwt = (payload) => `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url(payload)}.sig`;

const EXP = 2000000000;
const TOKEN = jwt({ exp: EXP, sqlStaffId: 42, uid: "u1" });

const header = { cookieSession: false };
const cookie = { cookieSession: true };

describe("storeSession", () => {
  it("keeps the token for x-token while the cookie is off", () => {
    const storage = memoryStorage();
    expect(storeSession({ token: TOKEN }, { storage, ...header })).toEqual({ exp: EXP, sqlStaffId: 42 });
    expect(storage.data[TOKEN_KEY]).toBe(TOKEN);
  });

  it("with the cookie, keeps only the CSRF token and the session's expiry, never the token", () => {
    const storage = memoryStorage();
    storeSession({ token: TOKEN, [CSRF_FIELD]: "csrf-1" }, { storage, ...cookie });
    expect(storage.data[TOKEN_KEY]).toBeUndefined();
    expect(Object.values(storage.data).join(" ")).not.toContain(TOKEN);
    expect(storage.data[CSRF_KEY]).toBe("csrf-1");
    expect(JSON.parse(storage.data[SESSION_CLAIMS_KEY])).toEqual({ exp: EXP, sqlStaffId: 42 });
  });

  it("with the cookie, refuses a sign-in answer without a CSRF token: every write would fail", () => {
    expect(() => storeSession({ token: TOKEN }, { storage: memoryStorage(), ...cookie })).toThrow();
  });

  it("refuses an answer without a usable token", () => {
    expect(() => storeSession({}, { storage: memoryStorage(), ...header })).toThrow();
    expect(() => storeSession({ token: "not-a-jwt" }, { storage: memoryStorage(), ...header })).toThrow();
  });
});

describe("reading the session", () => {
  it("reads the claims from the stored token, or from the stored expiry with the cookie", () => {
    const headerStorage = memoryStorage({ [TOKEN_KEY]: TOKEN });
    expect(readSessionClaims({ storage: headerStorage, ...header })).toEqual({ exp: EXP, sqlStaffId: 42 });
    const cookieStorage = memoryStorage({ [SESSION_CLAIMS_KEY]: JSON.stringify({ exp: EXP, sqlStaffId: 42 }) });
    expect(readSessionClaims({ storage: cookieStorage, ...cookie })).toEqual({ exp: EXP, sqlStaffId: 42 });
  });

  it("has no session when nothing is stored, or it is unreadable", () => {
    expect(readSessionClaims({ storage: memoryStorage(), ...header })).toBeNull();
    expect(readSessionClaims({ storage: memoryStorage({ [SESSION_CLAIMS_KEY]: "{" }), ...cookie })).toBeNull();
    expect(hasSession({ storage: memoryStorage(), ...cookie })).toBe(false);
    expect(hasSession({ storage: memoryStorage({ [TOKEN_KEY]: TOKEN }), ...header })).toBe(true);
  });

  it("names what changes when the session changes", () => {
    expect(readSessionMarker({ storage: memoryStorage({ [TOKEN_KEY]: TOKEN }), ...header })).toBe(TOKEN);
    expect(readSessionMarker({ storage: memoryStorage(), ...cookie })).toBeNull();
  });
});

describe("isSessionValid", () => {
  const now = (EXP - 60) * 1000;

  it("is valid until it expires", () => {
    expect(isSessionValid({ exp: EXP, sqlStaffId: 42 }, now)).toBe(true);
    expect(isSessionValid({ exp: EXP, sqlStaffId: 42 }, EXP * 1000)).toBe(false);
  });

  // Tokens issued before the backend's sqlStaffId fix (933d32ef).
  it("is not valid without the SQL staff id", () => {
    expect(isSessionValid({ exp: EXP }, now)).toBe(false);
    expect(isSessionValid(null, now)).toBe(false);
  });
});

describe("attachSession", () => {
  it("sends x-token while the cookie is off", () => {
    const config = attachSession({ method: "post", headers: {} }, { storage: memoryStorage({ [TOKEN_KEY]: TOKEN }), ...header });
    expect(config.headers["x-token"]).toBe(TOKEN);
    expect(config.withCredentials).toBeUndefined();
  });

  it("with the cookie, sends credentials and the CSRF token on writes, and no x-token", () => {
    const storage = memoryStorage({ [CSRF_KEY]: "csrf-1" });
    ["post", "put", "patch", "delete", "POST"].forEach((method) => {
      const config = attachSession({ method, headers: {} }, { storage, ...cookie });
      expect(config.withCredentials).toBe(true);
      expect(config.headers[CSRF_HEADER]).toBe("csrf-1");
      expect(config.headers["x-token"]).toBeUndefined();
    });
  });

  it("does not send the CSRF token on reads", () => {
    const storage = memoryStorage({ [CSRF_KEY]: "csrf-1" });
    [undefined, "get", "head", "options"].forEach((method) => {
      const config = attachSession({ method, headers: {} }, { storage, ...cookie });
      expect(config.withCredentials).toBe(true);
      expect(config.headers[CSRF_HEADER]).toBeUndefined();
    });
  });

  it("keeps an x-token a caller set itself while the cookie is off", () => {
    const config = attachSession({ headers: { "x-token": "explicit" } }, { storage: memoryStorage(), ...header });
    expect(config.headers["x-token"]).toBe("explicit");
  });
});

describe("requestCarriedSession", () => {
  it("is the x-token header while the cookie is off, and the credentials with it", () => {
    expect(requestCarriedSession({ headers: { "x-token": TOKEN } }, header)).toBe(true);
    expect(requestCarriedSession({ headers: {} }, header)).toBe(false);
    expect(requestCarriedSession({ withCredentials: true, headers: {} }, cookie)).toBe(true);
    expect(requestCarriedSession({ headers: {} }, cookie)).toBe(false);
  });
});

// Sign-in calls made before the session is stored (staff lookup, company
// list, the company picker's sign-out) authenticate with the answer itself.
describe("preSessionHeaders", () => {
  const answer = { token: TOKEN, [CSRF_FIELD]: "csrf-1" };

  it("is the answer's token while the cookie is off", () => {
    expect(preSessionHeaders(answer, header)).toEqual({ "x-token": TOKEN });
  });

  it("with the cookie, is the answer's CSRF token: the cookie travels on its own", () => {
    expect(preSessionHeaders(answer, cookie)).toEqual({ [CSRF_HEADER]: "csrf-1" });
  });

  it("is empty when the answer has nothing to send", () => {
    expect(preSessionHeaders(undefined, header)).toEqual({});
    expect(preSessionHeaders({ token: TOKEN }, cookie)).toEqual({});
  });
});

describe("logout", () => {
  it("clears the CSRF token and the stored expiry with the rest of the session", () => {
    expect(SESSION_STORAGE_KEYS).toEqual(expect.arrayContaining([TOKEN_KEY, CSRF_KEY, SESSION_CLAIMS_KEY]));
  });
});

// The switch to the cookie only works if nothing else reads or writes the
// token: a leftover setItem would put it back on disk.
describe("the session token in storage", () => {
  const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const files = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return files(full);
      return /\.jsx?$/.test(entry.name) && !/\.test\./.test(entry.name) ? [full] : [];
    });
  const STORAGE_CALL = /(getItem|setItem|removeItem)\(\s*["'`]admin-token["'`]/;

  it("is read and written only by sessionCredential.js", () => {
    const offenders = files(SRC).flatMap((file) =>
      fs
        .readFileSync(file, "utf8")
        .split("\n")
        .filter((line) => !line.trim().startsWith("//") && STORAGE_CALL.test(line))
        .map(() => path.relative(SRC, file).split(path.sep).join("/"))
    );
    expect(offenders).toEqual([]);
  });
});
