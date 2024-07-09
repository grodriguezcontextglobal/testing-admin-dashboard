import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutFormCompanySubscription from "../checkout/CheckoutFormCompanySubscription";
const stripePromise = loadStripe(import.meta.env.VITE_APP_PUBLIC_STRIPE_KEY);

export const CheckoutElementCompanySubscription = ({ clientSecret, total, type }) => {
  const options = {
    clientSecret,
  };

  return (
    <>
      {clientSecret && (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutFormCompanySubscription
            total={total}
            type={type}
            clientSecret={clientSecret}
          />
        </Elements>
      )}
    </>
  );
};
