import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { StripeCheckoutFormChargeTransactionFromDashboard } from "../checkout/StripeCheckoutFormChargeTransactionFormDashboard";
const stripePromise = loadStripe(
  import.meta.env.VITE_APP_PUBLIC_STRIPE_KEY
  // `pk_live_51JS4MGJAluu3aB96nGEaMmcFT9ZuTzRMQkWVLpOVDuNHXKDT5ZqeBxwmaL9eOihAglxPQTVITZSfbUN32DWpiY1g0074EJN6tZ`
);
// const stripePromise = loadStripe( 'pk_test_51JS4MGJAluu3aB96xB1ZXpKeDHf4o6lPKkPCXbSPwFDILlyOgAY5ReR59To4ehWuuJGf1nA1Ut3GPaPMqZR7A1Cj00mVh75k5r')

/**
 * @description StripeChecoutElementAdmin - Elements display after verify a valid clientSecret
 * @param {String} clientSecret -
 * @param {String} total - amount imported and passed to checkout element to be displayed in submit button
 * @returns {HTMLBodyElement}
 */
export const StripeElementChargeTransactionFromDashboard = ({
  clientSecret,
  total,
}) => {
  const options = {
    clientSecret,
  };

  /**
   * @description style and rules for check out element where credit card info will be collected
   * @type {Object}
   * @property {String} theme - theme of the checkout element
   * @property {String} labels - attribute for labels in the inputs of the checkout element
   * @property {Object} variables - variables of css for teh entires elements
   * @property {Object} rules - variables of css applied based on criterios
   */
  console.log("client secret", clientSecret);
  return (
    <>
      {clientSecret && (
        <Elements options={options} stripe={stripePromise}>
          <StripeCheckoutFormChargeTransactionFromDashboard total={total} />
        </Elements>
      )}
    </>
  );
};
