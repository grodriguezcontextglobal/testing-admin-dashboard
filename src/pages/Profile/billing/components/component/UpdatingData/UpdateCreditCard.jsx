import PropTypes from "prop-types";
import { Grid, Typography } from "@mui/material";
import { Modal, notification } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import { onAddCompanyAccountStripe } from "../../../../../../store/slices/adminSlice";
import { onAddNewPaymentMethodInSubscription } from "../../../../../../store/slices/stripeSlice";

const UpdateCreditCard = ({
  openUpdateCreditCardModal,
  setOpenUpdateCreditCardModal,
}) => {
  const { updatePaymentMethodInSubscription } = useSelector(
    (state) => state.stripe
  );
  const { companyAccountStripe } = useSelector((state) => state.admin);
  const [api, contextHolder] = notification.useNotification();
  const dispatch = useDispatch();
  const openNotificationWithIcon = (type, msg, dsct) => {
    return api[type]({
      message: msg,
      description: dsct,
    });
  };
  const updateSubscriptionData = () => {
    const { subscriptionHistory } = companyAccountStripe;
    const newUpdatedSubscriptionData = {
      ...subscriptionHistory.at(-1),
      latest_invoice: {
        ...subscriptionHistory.at(-1).latest_invoice,
        payment_intent: {
          ...subscriptionHistory.at(-1).paymentIntent,
          charges: {
            ...subscriptionHistory.at(-1).latest_invoice.payment_intent.charges,
            data: [
              {
                payment_method_details: {
                  ...subscriptionHistory.at(-1).latest_invoice.payment_intent
                    .charges.data[0].payment_method_details,
                  card: {
                    ...subscriptionHistory.at(-1).latest_invoice.payment_intent
                      .charges.data[0].payment_method_details.card,
                    brand:
                      updatePaymentMethodInSubscription.customer.card.brand,
                    country:
                      updatePaymentMethodInSubscription.customer.card.country,
                    exp_month:
                      updatePaymentMethodInSubscription.customer.card.exp_month,
                    exp_year:
                      updatePaymentMethodInSubscription.customer.card.exp_year,
                    fingerprint:
                      updatePaymentMethodInSubscription.customer.card
                        .fingerprint,
                    funding:
                      updatePaymentMethodInSubscription.customer.card.funding,
                    last4:
                      updatePaymentMethodInSubscription.customer.card.last4,
                    network:
                      updatePaymentMethodInSubscription.customer.card.networks
                        .available[0],
                  },
                },
              },
            ],
          },
        },
      },
      paymentIntent: {
        ...subscriptionHistory.at(-1).paymentIntent,
        charges: {
          ...subscriptionHistory.at(-1).paymentIntent.charges,
          data: [
            {
              payment_method_details: {
                ...subscriptionHistory.at(-1).paymentIntent.charges.data[0]
                  .payment_method_details,
                card: {
                  ...subscriptionHistory.at(-1).paymentIntent.charges.data[0]
                    .payment_method_details.card,
                  brand: updatePaymentMethodInSubscription.customer.card.brand,
                  country:
                    updatePaymentMethodInSubscription.customer.card.country,
                  exp_month:
                    updatePaymentMethodInSubscription.customer.card.exp_month,
                  exp_year:
                    updatePaymentMethodInSubscription.customer.card.exp_year,
                  fingerprint:
                    updatePaymentMethodInSubscription.customer.card.fingerprint,
                  funding:
                    updatePaymentMethodInSubscription.customer.card.funding,
                  last4: updatePaymentMethodInSubscription.customer.card.last4,
                  network:
                    updatePaymentMethodInSubscription.customer.card.networks
                      .available[0],
                },
              },
            },
          ],
        },
      },
    };
    return subscriptionHistory.toSpliced(
      subscriptionHistory.at(-1),
      1,
      newUpdatedSubscriptionData
    );
  };

  const updatePaymentMethodOfSubscriptionInDB = async ({ props }) => {
    try {
      const respUpdtSubInDB = await devitrakApi.patch(
        `/stripe/updating-subscription/${companyAccountStripe.id}`,
        props
      );
      if (respUpdtSubInDB.data.ok) {
        openNotificationWithIcon(
          "success",
          "Payment method updated",
          "Payment method updated in our records."
        );
      }
    } catch (error) {
      console.log(
        "🚀 ~ file: UpdateCreditCard.jsx:113 ~ updatePaymentMethodOfSubscriptionInDB ~ error:",
        error
      );
    }
  };

  const handleResponse = () => {
    if (updatePaymentMethodInSubscription.customer) {
      if (updatePaymentMethodInSubscription.ok) {
        let passUpdateCompanyAccountStripe = {
          ...companyAccountStripe,
          subscriptionHistory: updateSubscriptionData(),
        };
        dispatch(onAddCompanyAccountStripe(passUpdateCompanyAccountStripe));
        updatePaymentMethodOfSubscriptionInDB(passUpdateCompanyAccountStripe);
        dispatch(onAddNewPaymentMethodInSubscription(null));
        openNotificationWithIcon(
          "success",
          "Payment method updated",
          "New credit card was added to the existing subscriptions as new payment method for the futures invoices."
        );
        setTimeout(() => {
          closeModal();
        }, 3500);
      } else {
        dispatch(onAddNewPaymentMethodInSubscription(null));
        openNotificationWithIcon(
          "error",
          "Something went wrong!",
          "Please try later, if issue persists, contact administrator."
        );
        setTimeout(() => {
          closeModal();
        }, 3500);
      }
    }
    return null;
  };
  const closeModal = () => {
    return setOpenUpdateCreditCardModal(false);
  };

  const renderTitle = () => {
    return (
      <Typography
        width={"100%"}
        textTransform={"none"}
        color="var(--gray-900, #101828)"
        lineHeight={"28px"}
        textAlign={"center"}
        fontWeight={600}
        fontFamily={"Inter"}
        fontSize={"18px"}
        noWrap={true}
      >
        Updating subscription
      </Typography>
    );
  };
  return (
    <>
      {contextHolder}
      {updatePaymentMethodInSubscription !== null && handleResponse()}
      <Modal
        title={renderTitle()}
        style={{
          top: 20,
          margin: "auto",
        }}
        open={openUpdateCreditCardModal}
        onOk={() => closeModal()}
        onCancel={() => closeModal()}
        footer={[]}
        maskClosable = {false}
      >
        <Grid
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          margin={"auto"}
          container
        >
          <AddNewCreditCard />
        </Grid>
      </Modal>
    </>
  );
};

export default UpdateCreditCard;

UpdateCreditCard.propTypes = {
  openUpdateCreditCardModal: PropTypes.bool.isRequired,
  setOpenUpdateCreditCardModal: PropTypes.bool.isRequired,
};
