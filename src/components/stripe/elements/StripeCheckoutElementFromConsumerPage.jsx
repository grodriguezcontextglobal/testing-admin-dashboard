import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { StripeCheckoutFormConsumer } from "../checkout/StripeCheckFormConsumer";
const stripePromise = loadStripe(import.meta.env.VITE_APP_PUBLIC_STRIPE_KEY);
export const StripeCheckoutElementFromConsumerPage = ({ clientSecret, total, myUrl }) => {
  const options = {
    clientSecret,
  };
console.log('element - my url', myUrl);
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
