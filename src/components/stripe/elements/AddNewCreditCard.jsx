import { loadStripe } from "@stripe/stripe-js";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Grid, InputLabel, Typography } from "@mui/material";
import { Button, Divider } from "antd";
import { devitrakApi } from "../../../apis/devitrakApi";
import { useDispatch, useSelector } from "react-redux";
import { onAddNewPaymentMethodInSubscription } from "../../../store/slices/stripeSlice";
import { ConfigEnvExport } from "../../../config/ConfigEnvExport";
const stripePromise = loadStripe(ConfigEnvExport.stripe_public_key)

const FormAddNewCreditCardInfo = () => {
  const { companyAccountStripe } = useSelector((state) => state.admin);
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const OPTIONS = {
    showIcon: true,
    style: {
      base: {
        border: "dashed 1px #595757",
        borderRadius: "12px",
        padding: "12px",
        margin: "0.5rem",
        iconColor: "#252525",
        color: "#252525",
        fontWeight: "400",
        fontFamily: "Inter, sans-serif",
        fontSize: "16px",
        fontSmoothing: "antialiased",
        ":-webkit-autofill": {
          color: "#fce883",
        },
        "::placeholder": {
          color: "#595757",
        },
      },
      invalid: {
        iconColor: "#eb1c26",
        color: "#eb1c26",
      },
    },
  };
  const handleNewCreditCard = async (e) => {
    e.preventDefault();
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: "card",
      card: elements.getElement(CardNumberElement),
    });
    if (error) {
      return alert(`${error.message}`);
    }

    const respUpdatePaymtMethodInCustomer = await devitrakApi.post(
      `/stripe/payment_methods/${paymentMethod.id}/attach`,
      { customerID: `${companyAccountStripe.stripeID}` }
    );
    if (respUpdatePaymtMethodInCustomer.data.ok) {
      dispatch(
        onAddNewPaymentMethodInSubscription(
          respUpdatePaymtMethodInCustomer.data
        )
      );
    } else {
      dispatch(onAddNewPaymentMethodInSubscription(null));
    }
  };
  return (
    <Grid
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      margin={"auto"}
      container
    >
      <form onSubmit={handleNewCreditCard}>
        <Grid item xs={12} sm={12} md={12} lg={12}>
          <Grid item xs={12} sm={12} md={12} lg={12}>
            <InputLabel style={{ width: "100%", margin: "0.5rem auto" }}>
              <Typography>Card number</Typography>
            </InputLabel>
            <CardNumberElement options={OPTIONS} />
          </Grid>
          <Divider />
          <Grid item xs={12} sm={12} md={12} lg={12}>
            <InputLabel style={{ width: "100%", margin: "0.5rem auto" }}>
              <Typography>Expiration date</Typography>
            </InputLabel>
            <CardExpiryElement />
          </Grid>
          <Divider />
          <Grid item xs={12} sm={12} md={12} lg={12}>
            <InputLabel style={{ width: "100%", margin: "0.5rem auto" }}>
              <Typography>CVC</Typography>
            </InputLabel>
            <CardCvcElement />
          </Grid>
        </Grid>
        <Grid
          margin={"0.5rem auto 0.2rem"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <Button htmlType="submit">
            <Typography>Update</Typography>
          </Button>
        </Grid>
      </form>
    </Grid>
  );
};

/**
 * @description StripeChecoutElementAdmin - Elements display after verify a valid clientSecret
 * @param {String} clientSecret -
 * @param {String} total - amount imported and passed to checkout element to be displayed in submit button
 * @returns {HTMLBodyElement}
 */
export const AddNewCreditCard = () => {
  /**
   * @description style and rules for check out element where credit card info will be collected
   * @type {Object}
   * @property {String} theme - theme of the checkout element
   * @property {String} labels - attribute for lables in the inputs of the checkout element
   * @property {Object} variables - variables of css for teh entires elements
   * @property {Object} rules - variables of css applied based on criterios
   */

  return (
    <Elements stripe={stripePromise}>
      <FormAddNewCreditCardInfo />
    </Elements>
  );
};
