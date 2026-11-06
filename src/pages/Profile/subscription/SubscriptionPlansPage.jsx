import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Check } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import SectionHeader from "../../../components/documents/new_form_components/SectionHeader";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import { useStatusNotification } from "../../../components/notification/alerts/useStatusNotification";
import {
  BILLING_INTERVALS,
  currentPlanId,
  enterpriseContactHref,
  isStripeCheckoutUrl,
  limitFromSearch,
  limitReachedMessage,
  planLimitLines,
  planPrice,
  reachedLimits,
  SUBSCRIPTION_PLANS,
} from "../../../config/subscriptionPlans";
import { userFacingError } from "../../../utils/userFacingError";

const cardStyle = (highlighted) => ({
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  padding: "24px",
  borderRadius: "12px",
  border: highlighted
    ? "2px solid var(--blue-dark-600, #155EEF)"
    : "1px solid var(--gray-200, #EAECF0)",
  background: "var(--basewhite, #FFFFFF)",
  boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
  textAlign: "left",
});

const limitBannerStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid var(--warning-300, #FEC84B)",
  background: "var(--warning-25, #FFFCF5)",
  color: "var(--warning-700, #B54708)",
  fontSize: "14px",
  fontWeight: 500,
  textAlign: "left",
};

const PlanCard = ({ plan, interval, isCurrent, action }) => {
  const price = planPrice(plan, interval);
  return (
    <section aria-label={`${plan.name} plan`} style={cardStyle(isCurrent)}>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "var(--gray-900, #101828)" }}>
            {plan.name}
          </h3>
          {isCurrent && (
            <span
              style={{
                fontSize: "12px",
                fontWeight: 500,
                lineHeight: "18px",
                padding: "2px 8px",
                borderRadius: "999px",
                background: "var(--blue-dark-50, #EFF4FF)",
                color: "var(--blue-dark-700, #004EEB)",
              }}
            >
              Current plan
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--gray-600, #475467)" }}>{plan.tagline}</p>
      </div>

      <div>
        <span style={{ fontSize: "36px", fontWeight: 600, lineHeight: "44px", color: "var(--gray-900, #101828)" }}>
          {price.amount}
        </span>
        <span style={{ fontSize: "16px", color: "var(--gray-600, #475467)" }}>{price.period}</span>
        <p style={{ margin: "4px 0 0", minHeight: "20px", fontSize: "14px", color: "var(--gray-600, #475467)" }}>
          {price.note}
        </p>
      </div>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        {planLimitLines(plan).map((line) => (
          <li key={line} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "var(--gray-700, #344054)" }}>
            <Check size={18} color="var(--success-600, #039855)" aria-hidden="true" />
            {line}
          </li>
        ))}
      </ul>

      {action}
    </section>
  );
};

/**
 * Profile → Subscription. Shows the three plans and the company's current
 * one, starts a Stripe Checkout for Pro, and sends Enterprise to sales.
 *
 * Behind FEATURE_SUBSCRIPTION_PLANS: both endpoints below are asked of the
 * backend (FRONTEND_subscription_plans_update_2026-11-06.md) and do not exist
 * yet. The page is information plus a door to Stripe; the server owns the plan
 * and refuses writes over its caps.
 */
const SubscriptionPlansPage = () => {
  const { user } = useSelector((state) => state.admin);
  const companyId = user?.companyData?.id;
  const companyName = user?.companyData?.company_name ?? "";
  const { notify, contextHolder } = useStatusNotification();
  const [billingInterval, setBillingInterval] = useState("month");

  const subscriptionQuery = useQuery({
    queryKey: ["companySubscription", companyId],
    queryFn: () => devitrakApi.get("/company/subscription").then((response) => response.data),
    enabled: Boolean(companyId),
    retry: false,
  });
  const currentPlan = currentPlanId(subscriptionQuery.data);
  /* Why the person is here: the cap the plan-limit notice sent them for
     (api/planLimit.js), or one the server already reports as reached. */
  const { search } = useLocation();
  const reachedResource =
    limitFromSearch(search) ?? reachedLimits(subscriptionQuery.data)[0] ?? null;

  const checkout = useMutation({
    mutationFn: async ({ plan, billingInterval }) => {
      const response = await devitrakApi.post("/company/subscription/checkout", {
        plan,
        interval: billingInterval,
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (!isStripeCheckoutUrl(data?.url)) {
        notify("error", "We couldn't open the payment page.", "Please try again or contact support.");
        return;
      }
      window.location.assign(data.url);
    },
    onError: (error) => notify("error", "We couldn't open the payment page.", userFacingError(error)),
  });

  const actionFor = (plan) => {
    if (plan.id === currentPlan) {
      return <GrayButtonComponent title="Current plan" isDisabled styles={{ width: "100%" }} />;
    }
    if (plan.id === "enterprise") {
      return (
        <GrayButtonComponent
          title="Contact sales"
          href={enterpriseContactHref(companyName)}
          styles={{ width: "100%" }}
        />
      );
    }
    if (plan.id === "pro") {
      return (
        <BlueButtonComponent
          title="Upgrade to Pro"
          isLoading={checkout.isPending}
          func={() => checkout.mutate({ plan: plan.id, billingInterval })}
          styles={{ width: "100%" }}
        />
      );
    }
    // Moving down to Free goes through the billing portal or support, not here.
    return null;
  };

  return (
    <>
      {contextHolder}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "24px" }}>
        <SectionHeader
          title="Subscription"
          subtitle="Choose the plan that fits your team. Every company starts on Free."
        />

        <div role="group" aria-label="Billing interval" style={{ display: "flex", gap: "8px" }}>
          {BILLING_INTERVALS.map((option) => {
            const Button = option.id === billingInterval ? BlueButtonComponent : GrayButtonComponent;
            return (
              <Button
                key={option.id}
                size="sm"
                title={option.label}
                func={() => setBillingInterval(option.id)}
                ariaLabel={`${option.label} billing${option.id === billingInterval ? " (selected)" : ""}`}
              />
            );
          })}
        </div>

        {reachedResource && (
          <div role="status" style={limitBannerStyle}>
            <AlertTriangle size={20} aria-hidden="true" style={{ flexShrink: 0 }} />
            <span>{limitReachedMessage(reachedResource, subscriptionQuery.data)}</span>
          </div>
        )}

        {subscriptionQuery.isError && (
          <p style={{ margin: 0, fontSize: "14px", color: "var(--gray-600, #475467)", textAlign: "left" }}>
            We couldn&apos;t load your current plan, so it is shown as Free.
          </p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "24px",
          }}
        >
          {SUBSCRIPTION_PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              interval={billingInterval}
              isCurrent={plan.id === currentPlan}
              action={actionFor(plan)}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default SubscriptionPlansPage;
