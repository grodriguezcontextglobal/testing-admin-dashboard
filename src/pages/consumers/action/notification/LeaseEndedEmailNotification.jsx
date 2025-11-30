import { devitrakApi } from "../../../../api/devitrakApi";

const LeaseEndedEmailNotification = ({
  company,
  admin_email,
  customer,
  devicesList,
}) => {
  const template = {
    company_name: company,
    email_admin: admin_email,
    consumer: customer,
    devices: devicesList,
    subject: "Lease Notification",
    returnDate: new Date().toLocaleDateString(),
  };
  try {
    const send = async () => {
      const sendingNotification = await devitrakApi.post(
        "/nodemailer/consumer-lease-return-device-notification",
        {
          ...template,
        }
      );
      return alert(sendingNotification.data.notification);
    };
    return send();
  } catch (error) {
    console.log(error);
  }
};

export default LeaseEndedEmailNotification;
