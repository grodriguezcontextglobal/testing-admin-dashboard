import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutFormCompanySubscription from "../checkout/CheckoutFormCompanySubscription";
import { ConfigEnvExport } from "../../../config/ConfigEnvExport";

const stripePromise = loadStripe(ConfigEnvExport.stripe_public_key);

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
