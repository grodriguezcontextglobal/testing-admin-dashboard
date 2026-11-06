import { afterEach, describe, expect, it, vi } from "vitest";
import {
  handlePlanLimit,
  planLimitFrom,
  planLimitNotice,
  reachedLimitFrom,
  setPlanLimitHandler,
} from "./planLimit";

const refusal = (data, status = 403) => ({ isAxiosError: true, response: { status, data } });

const STAFF_REFUSAL = {
  ok: false,
  code: "PLAN_LIMIT_REACHED",
  resource: "staff",
  limit: 3,
  current: 3,
  requested: 1,
  plan: "free",
  msg: "Your Free plan includes up to 3 staff members. Upgrade to add more.",
};

describe("planLimitFrom", () => {
  it("reads the server's PLAN_LIMIT_REACHED refusal", () => {
    expect(planLimitFrom(refusal(STAFF_REFUSAL))).toEqual({
      resource: "staff",
      limit: 3,
      current: 3,
      requested: 1,
      plan: "free",
    });
  });

  it("accepts a 402 as well as a 403", () => {
    expect(planLimitFrom(refusal(STAFF_REFUSAL, 402))?.resource).toBe("staff");
  });

  it("ignores any other 403, and the same code on another status", () => {
    expect(planLimitFrom(refusal({ ok: false, msg: "Forbidden" }))).toBeNull();
    expect(planLimitFrom(refusal(STAFF_REFUSAL, 400))).toBeNull();
    expect(planLimitFrom({ isAxiosError: true })).toBeNull();
    expect(planLimitFrom(null)).toBeNull();
  });

  it("drops fields it does not recognise instead of trusting them", () => {
    expect(
      planLimitFrom(refusal({ code: "PLAN_LIMIT_REACHED", resource: "<b>", limit: "3", plan: 7 })),
    ).toEqual({ resource: null, limit: null, current: null, requested: null, plan: null });
  });
});

describe("planLimitNotice", () => {
  const limit = { resource: "staff", limit: 3, current: 3, requested: 1, plan: "free" };

  it("sends someone who can manage billing to the plans page", () => {
    expect(planLimitNotice(limit, { canManageBilling: true, plansPageEnabled: true })).toEqual({
      title: "Plan limit reached",
      description: "Upgrade your plan to add more staff members.",
      action: { label: "Upgrade plan", to: "/profile/subscription?limit=staff" },
    });
  });

  it("sends them to sales while the plans page is off", () => {
    const notice = planLimitNotice(
      { ...limit, resource: "items" },
      { canManageBilling: true, plansPageEnabled: false },
    );
    expect(notice.description).toBe("Upgrade your plan to add more inventory items.");
    expect(notice.action.label).toBe("Contact sales");
    expect(notice.action.href).toMatch(/^mailto:support@devitrak\.net\?/);
  });

  it("tells anyone else to ask an administrator, with no button", () => {
    const notice = planLimitNotice(limit, { canManageBilling: false, plansPageEnabled: true });
    expect(notice.description).toBe(
      "Upgrade your plan to add more staff members. Ask your company administrator to upgrade.",
    );
    expect(notice.action).toBeNull();
  });

  it("says how much room is left when an import is too big", () => {
    const notice = planLimitNotice(
      { resource: "items", limit: 1000, current: 840, requested: 1200, plan: "free" },
      { canManageBilling: true, plansPageEnabled: true },
    );
    expect(notice.description).toBe(
      "This import adds 1,200 inventory items and your plan has room for 160. Upgrade your plan to add more.",
    );
  });

  it("opens the plans page without a reason when the resource is unknown", () => {
    const notice = planLimitNotice(
      { resource: null, limit: null, current: null, requested: null, plan: null },
      { canManageBilling: true, plansPageEnabled: true },
    );
    expect(notice.action).toEqual({ label: "Upgrade plan", to: "/profile/subscription" });
  });

  it("still reads when the server left the resource out", () => {
    const notice = planLimitNotice(
      { resource: null, limit: null, current: null, requested: null, plan: null },
      { canManageBilling: true, plansPageEnabled: true },
    );
    expect(notice.description).toBe("Upgrade your plan to add more.");
  });
});

describe("reachedLimitFrom", () => {
  it("turns a cap the server reports as reached into the notice's input", () => {
    expect(
      reachedLimitFrom({
        plan: "free",
        limits: { staff: 3, items: 1000 },
        usage: { staff: 3, items: 20 },
      }),
    ).toEqual({ resource: "staff", limit: 3, current: 3, requested: null, plan: "free" });
  });

  it("is null while there is room, or with no record", () => {
    expect(
      reachedLimitFrom({ plan: "free", limits: { staff: 3, items: 1000 }, usage: { staff: 2, items: 20 } }),
    ).toBeNull();
    expect(reachedLimitFrom(undefined)).toBeNull();
  });
});

describe("handlePlanLimit", () => {
  afterEach(() => {
    setPlanLimitHandler(null);
  });

  it("marks the error and passes the refusal to the registered handler", () => {
    const handler = vi.fn();
    setPlanLimitHandler(handler);
    const error = refusal(STAFF_REFUSAL);
    expect(handlePlanLimit(error)).toBe(true);
    expect(error.isPlanLimit).toBe(true);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ resource: "staff", limit: 3 }));
  });

  it("leaves every other error alone", () => {
    const handler = vi.fn();
    setPlanLimitHandler(handler);
    const error = refusal({ msg: "Forbidden" });
    expect(handlePlanLimit(error)).toBe(false);
    expect(error.isPlanLimit).toBeUndefined();
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not throw with no handler registered", () => {
    expect(handlePlanLimit(refusal(STAFF_REFUSAL))).toBe(true);
  });
});
