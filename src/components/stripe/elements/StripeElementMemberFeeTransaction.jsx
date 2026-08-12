import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import PropTypes from "prop-types";
import CheckoutMemberFeeTransaction from "../checkout/CheckoutMemberFeeTransaction";
import { ConfigEnvExport } from "../../../config/ConfigEnvExport";

const stripePromise = loadStripe(ConfigEnvExport.stripe_public_key);

/**
 * Stripe Elements wrapper for the member device-fee charge.
 *
 * Keeps the `clientSecret &&` guard from StripeElementServicesTransaction:
 * Elements throws if mounted with an empty clientSecret, which is why the
 * sibling LostDeviceStripeElement (no guard) is not the one copied here.
 *
 * @param {string} clientSecret from /stripe/create-payment-intent-subscription
 * @param {number} total amount in integer cents, shown on the submit button
 * @param {string} [returnUrl] absolute URL Stripe redirects to after 3DS
 * @param {Function} [onSucceeded] called on a redirect-free success
 */
const StripeElementMemberFeeTransaction = ({
  clientSecret,
  total,
  returnUrl,
  onSucceeded,
}) => (
  <>
    {clientSecret && (
      <Elements options={{ clientSecret }} stripe={stripePromise}>
        <CheckoutMemberFeeTransaction
          total={total}
          returnUrl={returnUrl}
          onSucceeded={onSucceeded}
        />
      </Elements>
    )}
  </>
);

StripeElementMemberFeeTransaction.propTypes = {
  clientSecret: PropTypes.string,
  total: PropTypes.number,
  returnUrl: PropTypes.string,
  onSucceeded: PropTypes.func,
};

export default StripeElementMemberFeeTransaction;
