import { devitrakApi } from "../../../api/devitrakApi";

const sendRefundReceiptEmail = (props) => {
  const { customer, amount, paymentIntent, company, event } = props;
  const sendEmail = async () => {
    try {
      const emailTemplate = {
        email: customer.email,
        amount: amount,
        date: new Date().toString().slice(4, 15),
        paymentIntent: paymentIntent,
        customer: `${customer.name} ${customer.lastName}`,
        company: company,
        event: event
      };
      const response = await devitrakApi.post(
        "/nodemailer/refund-notification",
        emailTemplate
      );
      if (response.data) {
        return response.data;
      }
    } catch (error) {
      return error;
    }
  };
  sendEmail();
  return null;
};

export default sendRefundReceiptEmail;
