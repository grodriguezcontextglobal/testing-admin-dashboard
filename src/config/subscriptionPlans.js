/**
 * Devitrak subscription plans, as Gustavo set them on 2026-11-06.
 *
 * This is what the Subscription page in Profile shows. It is NOT the gate: the
 * server owns each company's plan, talks to Stripe and refuses the writes that
 * would go over a cap (server-testing/reports/
 * FRONTEND_subscription_plans_update_2026-11-06.md). If the numbers change,
 * change them here and tell the backend, whose config holds the real limits.
 */

/** Where the Enterprise "Contact sales" button sends its email. */
export const SALES_EMAIL = "support@devitrak.net";

export const BILLING_INTERVALS = [
  { id: "month", label: "Monthly" },
  { id: "year", label: "Annual" },
];

export const SUBSCRIPTION_PLANS = [
  {
    id: "free",
    name: "Free",
    tagline: "For small teams getting started.",
    prices: { month: 0, year: 0 },
    limits: { staff: 3, items: 1000 },
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For growing teams that run events every week.",
    prices: { month: 320, year: 3000 },
    limits: { staff: 10, items: 4000 },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For organizations with larger teams and inventory.",
    prices: null,
    limits: null,
  },
];

export const planById = (id) => SUBSCRIPTION_PLANS.find((plan) => plan.id === id);

const usd = (value) => `$${value.toLocaleString("en-US")}`;

/**
 * The price block of a plan card for one billing interval:
 * `{ amount, period, note }`. The annual note shows the monthly equivalent and
 * the saving against twelve monthly payments.
 */
export const planPrice = (plan, interval) => {
  if (!plan.prices) {
    return { amount: "Custom", period: "", note: "Priced for your organization" };
  }
  const amount = plan.prices[interval];
  const period = interval === "year" ? "/year" : "/month";
  if (interval !== "year" || amount === 0) return { amount: usd(amount), period, note: null };
  const perMonth = Math.round(amount / 12);
  const saving = plan.prices.month * 12 - amount;
  return {
    amount: usd(amount),
    period,
    note: `${usd(perMonth)}/month billed annually · save ${usd(saving)} a year`,
  };
};

/** The caps of a plan, as lines for its card. */
export const planLimitLines = (plan) => {
  if (!plan.limits) {
    return ["Staff and inventory sized to your needs", "Onboarding and support from our team"];
  }
  return [
    `Up to ${plan.limits.staff.toLocaleString("en-US")} staff members`,
    `Up to ${plan.limits.items.toLocaleString("en-US")} inventory items`,
  ];
};

/**
 * The company's plan id from the server's subscription record. A company with
 * no record, or with a plan this client does not know, is on Free.
 */
export const currentPlanId = (subscription) => {
  const plan = subscription?.plan;
  return planById(plan) ? plan : "free";
};

/** The resources a plan caps, and how a person reads each one. */
export const LIMIT_NOUNS = { staff: "staff members", items: "inventory items" };

const isLimitResource = (value) => Object.hasOwn(LIMIT_NOUNS, value);

/**
 * The resources the company is at or over the cap for, from the server's
 * record (§5: effective `limits`, `usage`). A null cap is no cap.
 */
export const reachedLimits = (subscription) => {
  const limits = subscription?.limits ?? {};
  const usage = subscription?.usage ?? {};
  return Object.keys(LIMIT_NOUNS).filter(
    (resource) =>
      Number.isFinite(limits[resource]) &&
      Number.isFinite(usage[resource]) &&
      usage[resource] >= limits[resource],
  );
};

/** The resource in `?limit=` that sent the person to the plans page, or null. */
export const limitFromSearch = (search) => {
  const value = new URLSearchParams(search ?? "").get("limit");
  return isLimitResource(value) ? value : null;
};

/** The banner at the top of the plans page when a cap has been reached. */
export const limitReachedMessage = (resource, subscription) => {
  const noun = LIMIT_NOUNS[resource] ?? "items";
  const cap = subscription?.limits?.[resource];
  const plan = planById(subscription?.plan);
  if (Number.isFinite(cap) && plan) {
    return `You've reached the ${cap.toLocaleString("en-US")} ${noun} included in your ${plan.name} plan. Upgrade to add more.`;
  }
  return `You've reached your plan's limit of ${noun}. Upgrade to add more.`;
};

/** mailto: link for the Enterprise "Contact sales" button. */
export const enterpriseContactHref = (companyName) => {
  const name = (companyName ?? "").trim();
  const subject = name ? `Devitrak Enterprise plan: ${name}` : "Devitrak Enterprise plan";
  const body = `Hello, we would like to talk about the Enterprise plan${name ? ` for ${name}` : ""}.`;
  const query = new URLSearchParams({ subject, body }).toString().replace(/\+/g, "%20");
  return `mailto:${SALES_EMAIL}?${query}`;
};

/**
 * True only for a Stripe Checkout page over https. The upgrade button sends
 * the browser to the URL the server returns; anything else is refused, so a
 * wrong response cannot turn the button into an open redirect.
 */
export const isStripeCheckoutUrl = (url) => {
  if (typeof url !== "string" || url === "") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "checkout.stripe.com";
  } catch {
    return false;
  }
};
