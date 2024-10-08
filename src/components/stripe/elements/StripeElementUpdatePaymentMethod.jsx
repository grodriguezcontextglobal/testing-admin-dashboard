import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { StripeCheckoutUpdatePaymentMethod } from "../checkout/StripeCheckoutUpdatePaymentMethod";
const stripePromise = loadStripe(import.meta.env.VITE_APP_PUBLIC_STRIPE_KEY);
export const StripeElementUpadatePaymentMethod = ({ clientSecret, paymentIntentId }) => {
  const options = {
    clientSecret,
    paymentMethodCreation: 'manual'
  };

  return (
    <>
      {clientSecret && (
        <Elements options={options} stripe={stripePromise}>
          <StripeCheckoutUpdatePaymentMethod paymentIntentId={paymentIntentId} />
        </Elements>
      )}
    </>
  );
};
