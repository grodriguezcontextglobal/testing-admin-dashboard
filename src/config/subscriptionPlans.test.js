import { describe, expect, it } from "vitest";
import {
  BILLING_INTERVALS,
  currentPlanId,
  enterpriseContactHref,
  planById,
  planLimitLines,
  planPrice,
  SALES_EMAIL,
  SUBSCRIPTION_PLANS,
} from "./subscriptionPlans";

describe("SUBSCRIPTION_PLANS", () => {
  it("offers three tiers in order: Free, Pro, Enterprise", () => {
    expect(SUBSCRIPTION_PLANS.map((plan) => plan.id)).toEqual(["free", "pro", "enterprise"]);
  });

  it("caps Free at 3 staff members and 1,000 inventory items", () => {
    expect(planById("free").limits).toEqual({ staff: 3, items: 1000 });
  });

  it("caps Pro at 10 staff members and 4,000 inventory items", () => {
    expect(planById("pro").limits).toEqual({ staff: 10, items: 4000 });
  });

  it("prices Pro at $320 a month or $3,000 a year", () => {
    expect(planById("pro").prices).toEqual({ month: 320, year: 3000 });
  });

  it("has no listed price or limits for Enterprise", () => {
    expect(planById("enterprise").prices).toBeNull();
    expect(planById("enterprise").limits).toBeNull();
  });

  it("returns undefined for an unknown plan", () => {
    expect(planById("gold")).toBeUndefined();
  });
});

describe("planPrice", () => {
  it("shows Free as $0 for either interval", () => {
    expect(planPrice(planById("free"), "month")).toEqual({ amount: "$0", period: "/month", note: null });
    expect(planPrice(planById("free"), "year")).toEqual({ amount: "$0", period: "/year", note: null });
  });

  it("shows the monthly Pro price", () => {
    expect(planPrice(planById("pro"), "month")).toEqual({
      amount: "$320",
      period: "/month",
      note: null,
    });
  });

  it("shows the annual Pro price with its monthly equivalent and the saving", () => {
    expect(planPrice(planById("pro"), "year")).toEqual({
      amount: "$3,000",
      period: "/year",
      note: "$250/month billed annually · save $840 a year",
    });
  });

  it("shows Enterprise as a custom price", () => {
    expect(planPrice(planById("enterprise"), "month")).toEqual({
      amount: "Custom",
      period: "",
      note: "Priced for your organization",
    });
  });

  it("knows the two billing intervals", () => {
    expect(BILLING_INTERVALS.map((interval) => interval.id)).toEqual(["month", "year"]);
  });
});

describe("planLimitLines", () => {
  it("lists the caps in words", () => {
    expect(planLimitLines(planById("free"))).toEqual(["Up to 3 staff members", "Up to 1,000 inventory items"]);
    expect(planLimitLines(planById("pro"))).toEqual(["Up to 10 staff members", "Up to 4,000 inventory items"]);
  });

  it("describes Enterprise limits as tailored", () => {
    expect(planLimitLines(planById("enterprise"))).toEqual([
      "Staff and inventory sized to your needs",
      "Onboarding and support from our team",
    ]);
  });
});

describe("currentPlanId", () => {
  it("treats a company with no subscription record as Free", () => {
    expect(currentPlanId(undefined)).toBe("free");
    expect(currentPlanId(null)).toBe("free");
    expect(currentPlanId({})).toBe("free");
  });

  it("uses the plan the server reports when it is a known one", () => {
    expect(currentPlanId({ plan: "pro" })).toBe("pro");
    expect(currentPlanId({ plan: "enterprise" })).toBe("enterprise");
  });

  it("falls back to Free for a plan this client does not know", () => {
    expect(currentPlanId({ plan: "business" })).toBe("free");
  });
});

describe("enterpriseContactHref", () => {
  it("opens an email to sales with the company in the subject", () => {
    const href = enterpriseContactHref("Acme Events");
    expect(href.startsWith(`mailto:${SALES_EMAIL}?`)).toBe(true);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("subject")).toBe("Devitrak Enterprise plan: Acme Events");
    expect(params.get("body")).toContain("Acme Events");
  });

  it("still builds a subject without a company name", () => {
    const params = new URLSearchParams(enterpriseContactHref("").split("?")[1]);
    expect(params.get("subject")).toBe("Devitrak Enterprise plan");
  });
});

describe("isStripeCheckoutUrl", () => {
  it("accepts a Stripe Checkout page over https", async () => {
    const { isStripeCheckoutUrl } = await import("./subscriptionPlans");
    expect(isStripeCheckoutUrl("https://checkout.stripe.com/c/pay/cs_test_123")).toBe(true);
  });

  // The page sends the browser wherever this URL points, so anything else is
  // refused rather than followed (an open redirect if the response were wrong).
  it.each([
    "http://checkout.stripe.com/c/pay/cs_test_123",
    "https://checkout.stripe.com.evil.example/pay",
    "https://evil.example/?https://checkout.stripe.com",
    "javascript:alert(1)",
    "",
    undefined,
    null,
  ])("refuses %s", async (url) => {
    const { isStripeCheckoutUrl } = await import("./subscriptionPlans");
    expect(isStripeCheckoutUrl(url)).toBe(false);
  });
});

describe("reachedLimits", () => {
  it("lists every resource whose usage is at or over its cap", async () => {
    const { reachedLimits } = await import("./subscriptionPlans");
    expect(
      reachedLimits({ limits: { staff: 3, items: 1000 }, usage: { staff: 3, items: 1200 } }),
    ).toEqual(["staff", "items"]);
    expect(reachedLimits({ limits: { staff: 3, items: 1000 }, usage: { staff: 2, items: 999 } })).toEqual([]);
  });

  it("treats a null cap as no cap, and a missing record as nothing reached", async () => {
    const { reachedLimits } = await import("./subscriptionPlans");
    expect(reachedLimits({ limits: { staff: null, items: null }, usage: { staff: 50, items: 9000 } })).toEqual([]);
    expect(reachedLimits({ plan: "free" })).toEqual([]);
    expect(reachedLimits(undefined)).toEqual([]);
  });
});

describe("limitFromSearch", () => {
  it("reads the resource the notice sent the person here for", async () => {
    const { limitFromSearch } = await import("./subscriptionPlans");
    expect(limitFromSearch("?limit=staff")).toBe("staff");
    expect(limitFromSearch("?limit=items&x=1")).toBe("items");
  });

  it("ignores anything else", async () => {
    const { limitFromSearch } = await import("./subscriptionPlans");
    expect(limitFromSearch("?limit=<script>")).toBeNull();
    expect(limitFromSearch("")).toBeNull();
    expect(limitFromSearch(undefined)).toBeNull();
  });
});

describe("limitReachedMessage", () => {
  it("names the cap and the plan when the record has them", async () => {
    const { limitReachedMessage } = await import("./subscriptionPlans");
    expect(limitReachedMessage("staff", { plan: "free", limits: { staff: 3 } })).toBe(
      "You've reached the 3 staff members included in your Free plan. Upgrade to add more.",
    );
    expect(limitReachedMessage("items", { plan: "pro", limits: { items: 4000 } })).toBe(
      "You've reached the 4,000 inventory items included in your Pro plan. Upgrade to add more.",
    );
  });

  it("still reads without a record", async () => {
    const { limitReachedMessage } = await import("./subscriptionPlans");
    expect(limitReachedMessage("staff", undefined)).toBe(
      "You've reached your plan's limit of staff members. Upgrade to add more.",
    );
  });
});
