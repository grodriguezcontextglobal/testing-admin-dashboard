import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useEffect, useState } from "react";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { devitrakApi } from "../../../api/devitrakApi";

export const StripeCheckoutUpdatePaymentMethod = ({ clientSecret, paymentIntentId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (!stripe) {
      return;
    }
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
    elements.submit();
    if (!stripe || !elements) {
      return;
    }
    setIsLoading(true);
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      elements,
    });
    if (!error) {
      const response = await devitrakApi.post(
        `/stripe/payment_intents/${paymentIntentId}/update-payment-method`,
        {
          paymentIntentId: paymentIntentId,
          newPaymentMethodID: paymentMethod.id,
        }
      );
      if (response.data.ok) {
        setMessage("Payment method updated successfully.");
        setIsLoading(false);
        return window.location.reload();
      }
    }
    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message);
      return setIsLoading(false);
    } else {
      setMessage("An unexpected error occurred.");
      return setIsLoading(false);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement options={paymentElementStyle} id="payment-element" />
      <button
        style={{ ...BlueButton, margin: "1rem auto", width: "100%" }}
        className="btn"
        disabled={isLoading || !stripe || !elements}
        id="submit"
      >
        <span style={{ ...BlueButtonText, ...CenteringGrid }} id="button-text">
          {isLoading ? (
            <div className="spinner" id="spinner"></div>
          ) : (
            `Update payment method`
          )}
        </span>
      </button>
      {message && <div id="payment-message">{message}</div>}
    </form>
  );
};
