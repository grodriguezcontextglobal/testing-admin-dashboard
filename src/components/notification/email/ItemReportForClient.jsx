import { message } from "antd";
import { devitrakApi } from "../../../api/devitrakApi";

const itemReportForClient = async ({
  customerInfo,
  event,
  paymentIntent,
  user,
  devicesInfo,
}) => {
  try {
    const response = await devitrakApi.post(
      "/nodemailer/device-report-per-transaction",
      {
        consumer: {
          email: customerInfo.email,
          firstName: customerInfo.name,
          lastName: customerInfo.lastName,
        },
        devices: [
          ...devicesInfo.map((item) => {
            return {
              device: { ...item },
              paymentIntent: paymentIntent,
            };
          }),
        ],
        event: event.eventInfoDetail.eventName,
        transaction: paymentIntent,
        company: user.companyData.id,
        link: `https://app.devitrak.net/?event=${event.id}&company=${user.companyData.id}`,
        admin: user.email,
      }
    );
    if (response.data.ok) {
      return message.success(
        `Device report was sent successfully to ${customerInfo.email}`
      );
    }
  } catch (error) {
    return message.error(`There was an error. ${error}`);
  }
};

export default itemReportForClient;
