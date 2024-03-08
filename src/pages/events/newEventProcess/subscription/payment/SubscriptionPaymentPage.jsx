import { useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../apis/devitrakApi";
import { StripeCheckoutElementAdmin } from "../admin/stripe/StripeCheckoutElementAdmin";

export const SubscriptionPaymentPage = () => {
  const { user } = useSelector((state) => state.admin);
  const { subscription } = useSelector((state) => state.subscription);
  const [trigger, setTrigger] = useState(false);
  const [clientSecretSubscription, setClientSecretSubscription] =
    useState(null);

  const stripeApiPayment = async () => {
    const resp = await devitrakApi.post(
      "/stripe/create-payment-intent-subscription",
      {
        total: subscription.price * 100,
        receipt_email: user.email,
      }
    );
    if (resp) {
      setClientSecretSubscription(resp.data.paymentSubscription.client_secret);
      await setTrigger(true);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "15% auto",
      }}
    >
      {trigger === false && (
        <button
          style={{ width: "fit-content" }}
          className="btn bt-create"
          onClick={() => stripeApiPayment()}
        >
          CLICK TO SUBMIT PAYMENT INFO
        </button>
      )}
      {trigger && (
        <StripeCheckoutElementAdmin clientSecret={clientSecretSubscription} />
      )}
    </div>
  );
};
