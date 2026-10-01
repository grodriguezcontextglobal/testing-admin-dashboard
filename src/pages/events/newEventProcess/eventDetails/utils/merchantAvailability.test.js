import { describe, expect, it } from "vitest";
import { hasStripeConnectedAccount, stripeAccountMode } from "./merchantAvailability";

/**
 * Requested 2026-09-25. An event could be marked as needing a merchant service
 * although the company never created its Stripe account, and nothing said so
 * until somebody tried to charge a card.
 *
 * The account that matters is the Stripe CONNECTED account the company charges
 * through — `companyData.stripe_connected_account[test|live]`, the one Profile
 * → Stripe account creates — not `companyAccountStripe`, which is the
 * company's own billing customer for its Devitrak subscription.
 */
describe("stripeAccountMode", () => {
  it("is test for a test publishable key, live otherwise", () => {
    expect(stripeAccountMode("pk_test_123")).toBe("test");
    expect(stripeAccountMode("pk_live_123")).toBe("live");
    expect(stripeAccountMode(undefined)).toBe("live");
  });
});

describe("hasStripeConnectedAccount", () => {
  const company = (accounts) => ({ stripe_connected_account: accounts });

  it("is true when the account for this mode exists", () => {
    expect(hasStripeConnectedAccount(company({ test: { id: "acct_1" } }), "pk_test_x")).toBe(true);
  });

  /* Created in test mode only: production cannot charge through it. */
  it("is false when only the other mode has one", () => {
    expect(hasStripeConnectedAccount(company({ test: { id: "acct_1" } }), "pk_live_x")).toBe(false);
  });

  it("is false when the company never created one", () => {
    expect(hasStripeConnectedAccount({}, "pk_live_x")).toBe(false);
    expect(hasStripeConnectedAccount(undefined, "pk_live_x")).toBe(false);
    expect(hasStripeConnectedAccount(company({ live: { id: "" } }), "pk_live_x")).toBe(false);
  });
});
