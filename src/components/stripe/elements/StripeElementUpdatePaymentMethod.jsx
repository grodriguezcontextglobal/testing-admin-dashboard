import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { StripeCheckoutUpdatePaymentMethod } from "../checkout/StripeCheckoutUpdatePaymentMethod";
import { ConfigEnvExport } from "../../../config/ConfigEnvExport";

const stripePromise = loadStripe(ConfigEnvExport.stripe_public_key);
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
