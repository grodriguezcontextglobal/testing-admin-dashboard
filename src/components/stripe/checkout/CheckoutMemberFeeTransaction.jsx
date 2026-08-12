import { useEffect, useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import PropTypes from "prop-types";
import BlueButtonComponent from "../../UX/buttons/BlueButton";
import { formatStripeAmount } from "../../../pages/conditionalPage/utils/memberFeeChargeUtils";

/**
 * Card collection for a member's device fee.
 *
 * Copied from CheckoutServicesTransaction (the event Services flow) rather than
 * reused, because that one hardcodes an event-attendee return_url and reads the
 * payer out of the stripe slice. Three defects in the original are fixed here
 * and deliberately not carried over:
 *
 * 1. It did `if (error.type === ...)` unconditionally. confirmPayment resolves
 *    with no `error` when the payment succeeds without a redirect, so the
 *    original threw a TypeError on the success path and reported nothing.
 * 2. It formatted the amount with String(total).slice(0, -2), which renders 99
 *    cents as an empty string.
 * 3. Its return_url pointed at a fixed event route. Here the caller passes it,
 *    defaulting to the current URL so staff land back on the member they were
 *    working on and the retrieve-intent effect below can report the outcome.
 *
 * @param {number} total amount in integer cents
 * @param {string} [returnUrl] absolute URL Stripe redirects to after 3DS
 * @param {Function} [onSucceeded] called when a redirect-free payment succeeds
 */
const CheckoutMemberFeeTransaction = ({ total, returnUrl, onSucceeded }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) return;

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );
    if (!clientSecret) return;

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case "succeeded":
          setMessage("Fee charged successfully.");
          break;
        case "processing":
          setMessage("Payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Payment was not successful — please try another card.");
          break;
        default:
          setMessage("Something went wrong with the payment.");
          break;
      }
    });
  }, [stripe]);

  const iFrameStyle = {
    base: {
      color: "var(--main-colorsfading-horizon)",
      fontSize: "16px",
      iconColor: "#fff",
      "::placeholder": {
        color: "var(--main-colorsfading-horizon)",
      },
    },
    invalid: {
      iconColor: "#FFC7EE",
      color: "#FFC7EE",
    },
    complete: {
      iconColor: "#cbf4c9",
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl || window.location.href,
      },
      redirect: "if_required",
    });

    // No error means the charge went through without needing a redirect. The
    // original assumed an error was always present and crashed here.
    if (!error) {
      setMessage("Fee charged successfully.");
      setIsLoading(false);
      onSucceeded?.(paymentIntent);
      return;
    }

    setMessage(
      error.type === "card_error" || error.type === "validation_error"
        ? error.message
        : "An unexpected error occurred — the card was not charged."
    );
    setIsLoading(false);
  };

  return (
    <form id="member-fee-payment-form" onSubmit={handleSubmit}>
      <PaymentElement
        options={{ style: iFrameStyle }}
        id="member-fee-payment-element"
      />
      <BlueButtonComponent
        buttonType="submit"
        disabled={isLoading || !stripe || !elements}
        isLoading={isLoading}
        id="submit-member-fee"
        styles={{ margin: "1rem auto", width: "100%" }}
      >
        {`Charge ${formatStripeAmount(total)}`}
      </BlueButtonComponent>
      {message && <div id="member-fee-payment-message">{message}</div>}
    </form>
  );
};

CheckoutMemberFeeTransaction.propTypes = {
  total: PropTypes.number,
  returnUrl: PropTypes.string,
  onSucceeded: PropTypes.func,
};

export default CheckoutMemberFeeTransaction;
