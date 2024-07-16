import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { StripeCheckoutForm } from "../checkout/StripeCheckForm";
const stripePromise = loadStripe(import.meta.env.VITE_APP_PUBLIC_STRIPE_KEY);
export const StripeCheckoutElement = ({ clientSecret, total }) => {
  const options = {
    clientSecret,
  };

  return (
    <>
      {clientSecret && (
        <Elements options={options} stripe={stripePromise}>
          <StripeCheckoutForm total={total} />
        </Elements>
      )}
    </>
  );
};
