import { describe, expect, it } from "vitest";
import {
  DEACTIVATE_PATH,
  buildDeactivationRequest,
  deactivationNotice,
  markDeactivated,
  readDeactivationResult,
  shouldUseLegacyDeactivation,
} from "./eventStaffDeactivation";

// GovRAMP code action #5 (FRONTEND_govramp_pending_2026-11-10.md, AC-2;
// backend reply 2026-11-04 §1.3). The server decides who loses access when an
// event ends, and keeps access for anyone on another active event of the
// company. The client stops sending the whole employee list.

describe("buildDeactivationRequest", () => {
  it("names the event and the SQL company", () => {
    expect(
      buildDeactivationRequest({ event: { id: "ev1" }, user: { sqlInfo: { company_id: 12 } } })
    ).toEqual({ eventId: "ev1", sqlCompanyId: 12 });
  });

  it("leaves the SQL company out when it is unknown, as the route allows", () => {
    expect(buildDeactivationRequest({ event: { id: "ev1" }, user: {} })).toEqual({ eventId: "ev1" });
  });

  it("refuses without an event id", () => {
    expect(() => buildDeactivationRequest({ event: {}, user: {} })).toThrow();
  });

  it("posts to the company route, which carries x-company-id", () => {
    expect(DEACTIVATE_PATH).toBe("/company/event-staff/deactivate");
  });
});

describe("readDeactivationResult", () => {
  it("reads who lost access, who kept it and what happened in SQL", () => {
    expect(
      readDeactivationResult({
        ok: true,
        deactivated: ["a@x.com"],
        keptInOtherEvents: ["b@x.com"],
        sql: { updated: 1 },
      })
    ).toEqual({ deactivated: ["a@x.com"], keptInOtherEvents: ["b@x.com"], sqlSkipped: null });
  });

  it("reports why SQL access was not updated", () => {
    expect(readDeactivationResult({ ok: true, sql: { skipped: "forbidden" } }).sqlSkipped).toBe("forbidden");
  });

  it("copes with missing lists", () => {
    expect(readDeactivationResult(undefined)).toEqual({ deactivated: [], keptInOtherEvents: [], sqlSkipped: null });
  });
});

describe("shouldUseLegacyDeactivation", () => {
  const failure = (status, data = { ok: false, msg: "No" }) => ({ response: { status, data } });

  // A server without the route answers Express's own HTML page.
  it("falls back only when the route does not exist", () => {
    expect(shouldUseLegacyDeactivation(failure(404, "<pre>Cannot POST /api/company/event-staff/deactivate</pre>"))).toBe(true);
    expect(shouldUseLegacyDeactivation(failure(404, ""))).toBe(true);
  });

  // The route's own 404s ("Event not found", "Company not found") are
  // answers, not a missing route.
  it("does not fall back on the route's own 404", () => {
    expect(shouldUseLegacyDeactivation(failure(404, { ok: false, msg: "Event not found" }))).toBe(false);
  });

  it("never falls back on a refusal: the server said no", () => {
    [400, 401, 403, 409, 500].forEach((status) =>
      expect(shouldUseLegacyDeactivation(failure(status))).toBe(false)
    );
    expect(shouldUseLegacyDeactivation(new Error("Network Error"))).toBe(false);
  });
});

describe("markDeactivated", () => {
  it("marks the server's list inactive in the company's employees", () => {
    const employees = [
      { user: "A@x.com", active: true },
      { user: "b@x.com", active: true },
    ];
    expect(markDeactivated(employees, ["a@x.com"])).toEqual([
      { user: "A@x.com", active: false },
      { user: "b@x.com", active: true },
    ]);
  });

  it("returns the same array when nobody lost access", () => {
    const employees = [{ user: "a@x.com", active: true }];
    expect(markDeactivated(employees, [])).toBe(employees);
    expect(markDeactivated(undefined, ["a@x.com"])).toEqual([]);
  });
});

describe("deactivationNotice", () => {
  it("says how many lost access", () => {
    expect(deactivationNotice({ deactivated: ["a", "b"], keptInOtherEvents: [], sqlSkipped: null })).toBe(
      "Event ended. Inventory is now in transit and will be available after warehouse check-in. " +
        "2 staff members no longer have access."
    );
  });

  it("says who kept access because of another active event", () => {
    expect(deactivationNotice({ deactivated: ["a"], keptInOtherEvents: ["b"], sqlSkipped: null })).toContain(
      "1 staff member no longer has access. 1 kept access because they work another active event."
    );
  });

  it("asks for an administrator when SQL access could not be updated", () => {
    expect(deactivationNotice({ deactivated: ["a"], keptInOtherEvents: [], sqlSkipped: "forbidden" })).toMatch(
      /could not be updated.*administrator/i
    );
  });

  it("does not mention a skip that only means there is no SQL company", () => {
    expect(
      deactivationNotice({ deactivated: [], keptInOtherEvents: [], sqlSkipped: "no_sql_company" })
    ).toBe("Event ended. Inventory is now in transit and will be available after warehouse check-in.");
  });
});
