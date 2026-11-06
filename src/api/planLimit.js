import { LIMIT_NOUNS, reachedLimits, SALES_EMAIL } from "../config/subscriptionPlans";

/**
 * What a write refused for the company's plan means when it reaches
 * devitrakApi.
 *
 * The server refuses new staff and new items over the plan's caps with one
 * shape everywhere (FRONTEND_subscription_plans_update_2026-11-06.md §4.3):
 *   403 { code: "PLAN_LIMIT_REACHED", resource: "staff" | "items",
 *         limit, current, requested, plan, msg }
 * The screen that made the request still shows its own error, and `msg` is
 * written for people, so userFacingError already shows why. What no screen
 * can do on its own is offer the way out, so the interceptor hands the refusal
 * to the handler App registers, which shows one notice with the next step.
 */

export const PLAN_LIMIT_CODE = "PLAN_LIMIT_REACHED";
export const PLANS_PAGE_PATH = "/profile/subscription";

const RESOURCE_NOUNS = LIMIT_NOUNS;

/** The plans page, told which cap sent the person there so it can say so. */
export const plansPagePath = (resource) =>
  Object.hasOwn(RESOURCE_NOUNS, resource) ? `${PLANS_PAGE_PATH}?limit=${resource}` : PLANS_PAGE_PATH;

const count = (value) => (Number.isFinite(value) && value >= 0 ? value : null);

/** The refusal's fields, or null when the error is anything else. */
export const planLimitFrom = (error) => {
  const response = error?.response;
  if (!response || (response.status !== 403 && response.status !== 402)) return null;
  const data = response.data;
  if (data?.code !== PLAN_LIMIT_CODE) return null;
  return {
    resource: Object.hasOwn(RESOURCE_NOUNS, data.resource) ? data.resource : null,
    limit: count(data.limit),
    current: count(data.current),
    requested: count(data.requested),
    plan: typeof data.plan === "string" ? data.plan : null,
  };
};

const UPGRADE = "Upgrade your plan to add more";

const describeLimit = ({ resource, limit, current, requested }) => {
  const noun = RESOURCE_NOUNS[resource];
  if (!noun) return `${UPGRADE}.`;
  if (requested > 1 && limit !== null && current !== null) {
    const room = Math.max(limit - current, 0);
    return `This import adds ${requested.toLocaleString("en-US")} ${noun} and your plan has room for ${room.toLocaleString("en-US")}. ${UPGRADE}.`;
  }
  return `${UPGRADE} ${noun}.`;
};

/**
 * The notice to show: who can pay is sent to the plans page, where "Upgrade
 * to Pro" opens Stripe Checkout (or to sales,
 * while that page is behind its flag); anyone else is told who to ask.
 */
export const planLimitNotice = (limit, { canManageBilling, plansPageEnabled }) => {
  const description = describeLimit(limit);
  if (!canManageBilling) {
    return {
      title: "Plan limit reached",
      description: `${description} Ask your company administrator to upgrade.`,
      action: null,
    };
  }
  const subject = encodeURIComponent("Devitrak plan upgrade");
  return {
    title: "Plan limit reached",
    description,
    action: plansPageEnabled
      ? { label: "Upgrade plan", to: plansPagePath(limit.resource) }
      : { label: "Contact sales", href: `mailto:${SALES_EMAIL}?subject=${subject}` },
  };
};

/**
 * The first cap the server's record (GET /company/subscription, §5) reports as
 * reached, shaped like a refusal so the same notice can say it before any
 * write fails. Null while there is room.
 */
export const reachedLimitFrom = (subscription) => {
  const [resource] = reachedLimits(subscription);
  if (!resource) return null;
  return {
    resource,
    limit: subscription.limits[resource],
    current: subscription.usage[resource],
    requested: null,
    plan: typeof subscription.plan === "string" ? subscription.plan : null,
  };
};

let planLimitHandler = null;

/** App registers what a refusal shows; null unregisters it. */
export const setPlanLimitHandler = (handler) => {
  planLimitHandler = typeof handler === "function" ? handler : null;
};

/** Called by devitrakApi's response interceptor for every failed request. */
export const handlePlanLimit = (error) => {
  const limit = planLimitFrom(error);
  if (!limit) return false;
  error.isPlanLimit = true;
  planLimitHandler?.(limit);
  return true;
};
