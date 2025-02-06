import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { StripeCheckoutFormConsumer } from "../checkout/StripeCheckFormConsumer";
import { ConfigEnvExport } from "../../../config/ConfigEnvExport";
const stripePromise = loadStripe(ConfigEnvExport.stripe_public_key);
export const StripeCheckoutElementFromConsumerPage = ({ clientSecret, total, myUrl }) => {
  const options = {
    clientSecret,
  };
  return (
    <>
      {clientSecret && (
        <Elements options={options} stripe={stripePromise}>
          <StripeCheckoutFormConsumer total={total} myUrl={myUrl} />
        </Elements>
      )}
    </>
  );
};
