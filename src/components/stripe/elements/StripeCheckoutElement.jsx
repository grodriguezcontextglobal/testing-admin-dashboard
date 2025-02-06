import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { StripeCheckoutForm } from "../checkout/StripeCheckForm";
import { ConfigEnvExport } from "../../../config/ConfigEnvExport";
const stripePromise = loadStripe(ConfigEnvExport.stripe_public_key);
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
