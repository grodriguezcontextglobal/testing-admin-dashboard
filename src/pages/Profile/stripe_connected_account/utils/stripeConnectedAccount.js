/**
 * The company's Stripe connected account, one per Stripe environment.
 *
 * Mongo keeps `companyData.stripe_connected_account` as `{ test, live }`: the
 * dashboard built with a test publishable key works with the test account,
 * production with the live one. Two writers broke that shape:
 *
 *  - Profile → Stripe account saved `{ id, login_links }` flat, which erased
 *    both keys. Every reader looks under `[test|live].id`, so a company that
 *    had just registered looked like it had no account, and no event could be
 *    given a merchant service.
 *  - The company sign-up wrote `{ test: null, live: null }` and filled one, so
 *    creating the account in one environment erased the other's.
 *
 * Every read and write goes through here now.
 */

const ENVIRONMENTS = ["test", "live"];

const hasId = (account) => Boolean(`${account?.id ?? ""}`.trim());

/**
 * `{ test, live }`, whatever was stored. A flat record (the old Profile write)
 * was written by the environment reading it, so it is read as `mode`'s.
 */
export function normalizeConnectedAccounts(value, mode) {
  const accounts = { test: null, live: null };
  if (!value || typeof value !== "object") return accounts;

  const isFlat = !ENVIRONMENTS.some((env) => env in value) && hasId(value);
  if (isFlat) {
    accounts[mode] = value;
    return accounts;
  }
  ENVIRONMENTS.forEach((env) => {
    accounts[env] = hasId(value[env]) ? value[env] : null;
  });
  return accounts;
}

/** This environment's connected account, or null. */
export function connectedAccountFor(companyData, mode) {
  return normalizeConnectedAccounts(companyData?.stripe_connected_account, mode)[mode];
}

/**
 * The PATCH body for `/company/update-company/:id` (and its register-process
 * twin) after Stripe creates an account: the new account under its
 * environment, the other environment's account kept.
 */
export function buildConnectedAccountUpdate(existing, mode, account) {
  return {
    stripe_connected_account: {
      ...normalizeConnectedAccounts(existing, mode),
      [mode]: { id: account?.id, login_links: account?.login_links },
    },
  };
}
