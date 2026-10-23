import { describe, expect, it } from "vitest";
import {
  buildConnectedAccountUpdate,
  connectedAccountFor,
  normalizeConnectedAccounts,
} from "./stripeConnectedAccount";

const acct = (id) => ({ id, login_links: { url: `https://connect/${id}` } });

describe("normalizeConnectedAccounts", () => {
  it("keeps the two environments as they are", () => {
    expect(
      normalizeConnectedAccounts({ test: acct("acct_t"), live: acct("acct_l") }, "live")
    ).toEqual({ test: acct("acct_t"), live: acct("acct_l") });
  });

  // Profile → Stripe account saved { id, login_links } flat until 2026-10-23,
  // which erased test/live: the company looked like it had no account.
  it("reads a flat record saved by the old Profile screen as this environment's", () => {
    expect(normalizeConnectedAccounts(acct("acct_flat"), "live")).toEqual({
      test: null,
      live: acct("acct_flat"),
    });
  });

  it("is empty for nothing at all", () => {
    expect(normalizeConnectedAccounts(undefined, "test")).toEqual({ test: null, live: null });
    expect(normalizeConnectedAccounts({}, "test")).toEqual({ test: null, live: null });
  });
});

describe("connectedAccountFor", () => {
  it("returns the account of the environment asked for", () => {
    const companyData = { stripe_connected_account: { test: acct("acct_t"), live: null } };
    expect(connectedAccountFor(companyData, "test")).toEqual(acct("acct_t"));
    expect(connectedAccountFor(companyData, "live")).toBeNull();
  });

  it("treats an account without an id as none", () => {
    expect(
      connectedAccountFor({ stripe_connected_account: { live: { id: "  " } } }, "live")
    ).toBeNull();
  });

  it("finds the account of a company saved in the old flat shape", () => {
    expect(
      connectedAccountFor({ stripe_connected_account: acct("acct_flat") }, "live")
    ).toEqual(acct("acct_flat"));
  });
});

describe("buildConnectedAccountUpdate", () => {
  it("stores a new account under its environment", () => {
    expect(buildConnectedAccountUpdate(undefined, "test", acct("acct_t"))).toEqual({
      stripe_connected_account: { test: acct("acct_t"), live: null },
    });
  });

  // The company sign-up wrote { test: null, live: null } and then filled one,
  // so creating a test account erased the live one.
  it("keeps the other environment's account", () => {
    expect(
      buildConnectedAccountUpdate({ live: acct("acct_l"), test: null }, "test", acct("acct_t"))
    ).toEqual({ stripe_connected_account: { test: acct("acct_t"), live: acct("acct_l") } });
  });

  // A flat record was written by this same environment, so a new account for
  // it takes its place, and the result is in the two-environment shape.
  it("replaces an old flat record of this environment, in the right shape", () => {
    expect(buildConnectedAccountUpdate(acct("acct_old"), "test", acct("acct_t"))).toEqual({
      stripe_connected_account: { test: acct("acct_t"), live: null },
    });
  });

  it("keeps only the id and the login links of what Stripe returned", () => {
    expect(
      buildConnectedAccountUpdate(undefined, "live", { ...acct("acct_l"), email: "x@y.co" })
    ).toEqual({ stripe_connected_account: { test: null, live: acct("acct_l") } });
  });
});
