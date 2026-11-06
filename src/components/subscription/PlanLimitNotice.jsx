import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import {
  PLANS_PAGE_PATH,
  planLimitNotice,
  reachedLimitFrom,
  setPlanLimitHandler,
} from "../../api/planLimit";
import { FEATURE_SUBSCRIPTION_PLANS } from "../../config/featureFlags";
import { hasPermission, resolveRoleType } from "../../config/roles";
import BlueButtonComponent from "../UX/buttons/BlueButton";
import { useStatusNotification } from "../notification/alerts/useStatusNotification";

const SHOWN_KEY = "devitrak-plan-limit-notice-shown";

const shownThisSession = (companyId) => {
  try {
    return sessionStorage.getItem(SHOWN_KEY) === String(companyId);
  } catch {
    return false;
  }
};

const markShown = (companyId) => {
  try {
    sessionStorage.setItem(SHOWN_KEY, String(companyId));
  } catch {
    // Without sessionStorage the notice may show again on the next load.
  }
};

/**
 * Tells the company it has reached a cap of its plan, with the way to upgrade:
 * "Upgrade plan" opens Profile → Subscription, where "Upgrade to Pro" goes to
 * Stripe Checkout.
 *
 * - When the server refuses a new staff member or item (api/planLimit.js),
 *   for everyone; whoever cannot manage billing is told to ask an admin.
 * - When the server's record already shows a cap reached (GET
 *   /company/subscription), before anything fails: once per browser session,
 *   only to whoever can manage billing, and not on the plans page itself,
 *   which says it in its own banner. Only with FEATURE_SUBSCRIPTION_PLANS on,
 *   since that endpoint is what the flag waits for.
 *
 * Mounted lazily from App, never imported by it: App loads before index.css
 * and the Untitled UI skin, so a component imported there would pull its CSS
 * (BlueButton's) ahead of them and lose the cascade across the whole app.
 */
const PlanLimitNotice = () => {
  const { user } = useSelector((state) => state.admin);
  const companyId = user?.companyData?.id;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { notify, contextHolder } = useStatusNotification();
  const canManageBilling = hasPermission("profile:billing", resolveRoleType(user));

  const show = useCallback(
    (limit) => {
      const { title, description, action } = planLimitNotice(limit, {
        canManageBilling,
        plansPageEnabled: FEATURE_SUBSCRIPTION_PLANS,
      });
      notify("warning", title, {
        description,
        key: "plan-limit-reached",
        duration: 10,
        btn: action ? (
          <BlueButtonComponent
            size="sm"
            title={action.label}
            href={action.href ?? null}
            func={action.to ? () => navigate(action.to) : null}
          />
        ) : undefined,
      });
    },
    [canManageBilling, navigate, notify],
  );

  useEffect(() => {
    setPlanLimitHandler(show);
    return () => setPlanLimitHandler(null);
  }, [show]);

  // Same key as the plans page, so both read one request.
  const subscriptionQuery = useQuery({
    queryKey: ["companySubscription", companyId],
    queryFn: () => devitrakApi.get("/company/subscription").then((response) => response.data),
    enabled: FEATURE_SUBSCRIPTION_PLANS && canManageBilling && Boolean(companyId),
    retry: false,
  });

  useEffect(() => {
    if (pathname.startsWith(PLANS_PAGE_PATH) || shownThisSession(companyId)) return;
    const reached = reachedLimitFrom(subscriptionQuery.data);
    if (!reached) return;
    markShown(companyId);
    show(reached);
  }, [subscriptionQuery.data, companyId, pathname, show]);

  return contextHolder;
};

export default PlanLimitNotice;
