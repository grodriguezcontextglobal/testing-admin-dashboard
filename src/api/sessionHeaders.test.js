import { afterEach, describe, expect, it } from "vitest";
import {
  SESSION_STORAGE_KEYS,
  buildRequestPath,
  buildRouteScopedHeaders,
  clearSessionStorage,
  persistCompanyHeaders,
} from "./sessionHeaders";

afterEach(() => {
  localStorage.clear();
});

describe("buildRequestPath", () => {
  it("joins the baseURL pathname with the request url", () => {
    expect(
      buildRequestPath("https://api.devitrak.net/api", "/db_staff/companies"),
    ).toBe("/api/db_staff/companies");
  });

  it("keeps the /admin suffix from the admin instance baseURL", () => {
    expect(buildRequestPath("https://api.devitrak.net/api/admin", "/login")).toBe(
      "/api/admin/login",
    );
  });

  it("collapses duplicate slashes", () => {
    expect(buildRequestPath("https://api.devitrak.net/api/", "/company")).toBe(
      "/api/company",
    );
  });

  it("falls back to string concatenation when baseURL is not a valid URL", () => {
    expect(buildRequestPath("/api", "/stripe/x")).toBe("/api/stripe/x");
  });

  it("tolerates a missing url", () => {
    expect(buildRequestPath("https://api.devitrak.net/api/admin")).toBe(
      "/api/admin",
    );
  });
});

describe("buildRouteScopedHeaders", () => {
  const values = { companyId: "665f0abc", companySqlId: "42" };

  it.each([
    "/api/staff/list",
    "/api/admin/login",
    "/api/company/search-company",
    "/api/stripe/account",
  ])("attaches x-company-id on company/staff/admin/stripe route %s", (path) => {
    const headers = buildRouteScopedHeaders(path, values);
    expect(headers["x-company-id"]).toBe("665f0abc");
    expect(headers).not.toHaveProperty("s-company-lq");
  });

  it.each([
    "/api/db_staff/companies",
    "/api/db_company/consulting-company",
    "/api/db_stripe/consulting-stripe",
    "/api/db_event/events_information",
  ])("attaches s-company-lq on db_ route %s", (path) => {
    const headers = buildRouteScopedHeaders(path, values);
    expect(headers["s-company-lq"]).toBe("42");
    expect(headers).not.toHaveProperty("x-company-id");
  });

  it("does not treat /api/db_company as an x-company-id (company) route", () => {
    const headers = buildRouteScopedHeaders("/api/db_company/x", values);
    expect(headers).not.toHaveProperty("x-company-id");
  });

  it("omits headers whose stored value is missing", () => {
    expect(buildRouteScopedHeaders("/api/staff/list", { companyId: null })).toEqual(
      {},
    );
    expect(
      buildRouteScopedHeaders("/api/db_staff/x", { companySqlId: "" }),
    ).toEqual({});
  });

  it("adds nothing for unrelated routes", () => {
    expect(buildRouteScopedHeaders("/api/article/upload", values)).toEqual({});
    expect(buildRouteScopedHeaders("/api/event/event-list", values)).toEqual({});
  });
});

describe("persistCompanyHeaders", () => {
  it("stores both company header values as strings", () => {
    persistCompanyHeaders({ companyId: "665f0abc", companySqlId: 42 });
    expect(localStorage.getItem("x-company-id")).toBe("665f0abc");
    expect(localStorage.getItem("s-company-lq")).toBe("42");
  });

  it("skips null/undefined/empty values without overwriting", () => {
    localStorage.setItem("x-company-id", "existing");
    persistCompanyHeaders({ companyId: null, companySqlId: undefined });
    expect(localStorage.getItem("x-company-id")).toBe("existing");
    expect(localStorage.getItem("s-company-lq")).toBeNull();
  });
});

describe("clearSessionStorage", () => {
  it("removes every session storage key", () => {
    SESSION_STORAGE_KEYS.forEach((key) => localStorage.setItem(key, "x"));
    localStorage.setItem("unrelated", "keep");
    clearSessionStorage();
    SESSION_STORAGE_KEYS.forEach((key) =>
      expect(localStorage.getItem(key)).toBeNull(),
    );
    expect(localStorage.getItem("unrelated")).toBe("keep");
  });
});
