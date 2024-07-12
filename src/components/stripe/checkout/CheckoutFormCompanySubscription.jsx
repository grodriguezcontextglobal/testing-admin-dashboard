import { useEffect, useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";

const CheckoutFormCompanySubscription = ({ clientSecret, type, total }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState();
  const [loading, setLoading] = useState(false);
  const myUrl = window.location.origin;
  const handleError = (error) => {
    setLoading(false);
    setErrorMessage(error.message);
  };
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

  const paymentElementStyle = {
    style: iFrameStyle,
  };

  useEffect(() => {
    if (!stripe) {
      return;
    }
    if (!clientSecret) {
      return;
    }

    // stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
    //   switch (paymentIntent.status) {
    //     case "succeeded":
    //       setErrorMessage("Payment succeeded!");
    //       break;
    //     case "processing":
    //       setErrorMessage("Your payment is processing.");
    //       break;
    //     case "requires_payment_method":
    //       setErrorMessage("Your payment was not successful, please try again.");
    //       break;
    //     default:
    //       setErrorMessage("Something went wrong.");
    //       break;
    //   }
    // });
  }, [stripe]);

  const handleSubmit = async (event) => {
    // We don't want to let default form submission happen here,
    // which would refresh the page.
    event.preventDefault();

    if (!stripe) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setLoading(true);

    // Trigger form validation and wallet collection
    const { error: submitError } = await elements.submit();
    if (submitError) {
      handleError(submitError);
      return;
    }
    const confirmIntent =
      type === "setup" ? stripe.confirmSetup : stripe.confirmPayment;
    // Confirm the Intent using the details collected by the Payment Element
    const { error } = await confirmIntent({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${myUrl}/confirm-subscription`,
      },
    });

    if (error) {
      // This point is only reached if there's an immediate error when confirming the Intent.
      // Show the error to your customer (for example, "payment details incomplete").
      handleError(error);
    } 
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement options={paymentElementStyle} id="payment-element" />
      <button
        style={{ ...BlueButton, margin: "1rem auto", width: "100%" }}
        className="btn"
        disabled={loading || !stripe || !elements}
        id="submit"
      >
        <span style={{ ...BlueButtonText, ...CenteringGrid }} id="button-text">
          {loading ? (
            <div className="spinner" id="spinner"></div>
          ) : (
            `Authorize $${total}`
          )}
        </span>
      </button>
      {errorMessage && <div id="payment-message">{errorMessage}</div>}
    </form>
  );
};
export default CheckoutFormCompanySubscription;
