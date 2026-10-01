/**
 * Whether this company can offer a merchant service on an event (requested
 * 2026-09-25): an event could be marked as needing one although the company
 * never created its Stripe account, and nothing said so until somebody tried
 * to charge a card.
 *
 * The account that matters is the Stripe CONNECTED account the company charges
 * through — `companyData.stripe_connected_account[test|live]`, the one
 * Profile → Stripe account creates. Not `companyAccountStripe`: that is the
 * company's own billing customer for its Devitrak subscription.
 */

/** Same rule the Stripe account screens use: a test key means test mode. */
export const stripeAccountMode = (publishableKey) =>
  String(publishableKey ?? "").includes("test") ? "test" : "live";

export const hasStripeConnectedAccount = (companyData, publishableKey) =>
  Boolean(
    `${companyData?.stripe_connected_account?.[stripeAccountMode(publishableKey)]?.id ?? ""}`.trim()
  );

/** Where the account is created. */
export const STRIPE_ACCOUNT_SETUP_ROUTE = "/profile/stripe_connected_account";
