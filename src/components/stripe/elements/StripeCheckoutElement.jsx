import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { StripeCheckoutForm } from "../checkout/StripeCheckForm";
const stripePromise = loadStripe(import.meta.env.VITE_APP_PUBLIC_STRIPE_KEY
  // `pk_live_51JS4MGJAluu3aB96nGEaMmcFT9ZuTzRMQkWVLpOVDuNHXKDT5ZqeBxwmaL9eOihAglxPQTVITZSfbUN32DWpiY1g0074EJN6tZ`
);
// const stripePromise = loadStripe( 'pk_test_51JS4MGJAluu3aB96xB1ZXpKeDHf4o6lPKkPCXbSPwFDILlyOgAY5ReR59To4ehWuuJGf1nA1Ut3GPaPMqZR7A1Cj00mVh75k5r')
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
