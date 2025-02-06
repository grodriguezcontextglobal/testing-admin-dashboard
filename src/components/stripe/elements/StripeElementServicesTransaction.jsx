import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutServicesTransaction from "../checkout/CheckoutServicesTransaction";
import { ConfigEnvExport } from "../../../config/ConfigEnvExport";

const stripePromise = loadStripe(ConfigEnvExport.stripe_public_key);

/**
 * @description StripeCheckoutElementAdmin - Elements display after verify a valid clientSecret
 * @param {String} clientSecret -
 * @param {String} total - amount imported and passed to checkout element to be displayed in submit button
 * @returns {HTMLBodyElement}
 */
const StripeElementServicesTransaction = ({ clientSecret, total }) => {
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
  return (
    <>
      {clientSecret && (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutServicesTransaction total={total} />
        </Elements>
      )}
    </>
  );
};

export default StripeElementServicesTransaction;
