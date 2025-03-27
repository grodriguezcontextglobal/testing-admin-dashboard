import { useEffect, useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
// import "./checkoutStyles.css";
import { useSelector } from "react-redux";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";

export const CustomerLostItemFeeCheckout = ({
  total,
  redirectUrl,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { customer } = useSelector((state) => state.stripe);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Your payment was not successful, please try again.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe]);
  const myUrl = window.location.origin;

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: myUrl + `/consumers/${customer.uid}/${redirectUrl}`,
      },
    });
    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message);
    } else {
      setMessage("An unexpected error occurred.");
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement options={paymentElementStyle} id="payment-element" />
      <button
        style={{ ...BlueButton, width: "100%", margin: "2dvh 0 0" }}
        // className="btn"
        disabled={isLoading || !stripe || !elements}
        id="submit"
      >
        <span
          style={{
            ...BlueButtonText,
            margin: "auto",
            textTransform: "capitalize",
          }}
        >
          {isLoading ? (
            <div className="spinner" id="spinner"></div>
          ) : (
            `charge $${total}`
          )}
        </span>
      </button>
      {message && <div id="payment-message">{message}</div>}
    </form>
  );
};
