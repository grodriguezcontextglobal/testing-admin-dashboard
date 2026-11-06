import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { planLimitNotice, setPlanLimitHandler } from "../../api/planLimit";
import { FEATURE_SUBSCRIPTION_PLANS } from "../../config/featureFlags";
import { hasPermission, resolveRoleType } from "../../config/roles";
import BlueButtonComponent from "../UX/buttons/BlueButton";
import { useStatusNotification } from "../notification/alerts/useStatusNotification";

/**
 * Shows the way to upgrade when the server refuses a new staff member or item
 * for the company's plan (api/planLimit.js). One notice at a time, keyed, so a
 * burst of refusals from an import does not stack them.
 *
 * Mounted lazily from App, never imported by it: App loads before index.css
 * and the Untitled UI skin, so a component imported there would pull its CSS
 * (BlueButton's) ahead of them and lose the cascade across the whole app.
 */
const PlanLimitNotice = () => {
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const { notify, contextHolder } = useStatusNotification();
  const canManageBilling = hasPermission("profile:billing", resolveRoleType(user));

  useEffect(() => {
    setPlanLimitHandler((limit) => {
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
    });
    return () => setPlanLimitHandler(null);
  }, [canManageBilling, navigate, notify]);

  return contextHolder;
};

export default PlanLimitNotice;
