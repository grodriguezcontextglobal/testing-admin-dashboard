import { Space, Table } from "antd";
import { useEffect, useState } from "react";
import { devitrakApi } from "../../../api/devitrakApi";
import { Subtitle } from "../../../styles/global/Subtitle";
import "../localStyles.css";
const FooterExpandedRow = ({
  // handleReturnSingleDevice,
  // handleLostSingleDevice,
  dataRendering,
  returningDevice,
  formattedData,
  paymentIntentInfoRetrieved,
}) => {
  const returningAllAtOnce = () => {
    for (let data of formattedData) {
      returningDevice(data);
    }
  };
  const [ccInfo, setCcInfo] = useState([]);
  // const [openModal, setOpenModal] = useState(false);
  const retrieveCCInfo = async () => {
    const resp = await devitrakApi
      .get(`/stripe/payment_intents/${dataRendering.paymentIntent}`)
      .then((response) => response.data);
    paymentIntentInfoRetrieved(resp.paymentIntent);
    return setCcInfo(resp.paymentIntent);
  };

  useEffect(() => {
    const controller = new AbortController();
    if (
      dataRendering.paymentIntent.length > 15 &&
      !String(dataRendering.paymentIntent).includes("cash")
    ) {
      retrieveCCInfo();
    }
    return () => {
      controller.abort();
    };
  }, []);

  const dataToBeRendered = () => {
    if (dataRendering.paymentIntent.length < 16) {
      return "Free deposit transaction";
    } else if (
      dataRendering.paymentIntent.length > 15 &&
      String(dataRendering.paymentIntent).includes("cash")
    ) {
      return "Deposit's method: cash";
    } else {
      return `Credit card ending in: ${ccInfo?.charges?.data[0]?.payment_method_details?.card?.last4}`;
    }
  };

  const rendering = [
    {
      deposit: dataToBeRendered(),
      status: false,
      serial_number: "",
      data: [dataRendering],
    },
  ];
  const footerColumn = [
    {
      title: "Deposit",
      dataIndex: "deposit",
      key: "deposit",
      render: (deposit) => (
        <p style={{ ...Subtitle, height: "0.5dvh" }}>{deposit}</p>
      ),
    },
    {
      title: "Device",
      key: "serial_number",
      // render: () => (
      //   <button
      //     disabled
      //     style={{
      //       ...Subtitle,
      //       color: "var(--blue-dark--800)",
      //       outline: "none",
      //       margin: "0",
      //       backgroundColor: "transparent",
      //       border: "none",
      //     }}
      //   >
      //     Change card
      //   </button>
      // ),
    },
    {
      title: "Cost of device",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <p style={{ ...Subtitle, height: "0.5dvh" }}>{status}</p>
      ),
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <p style={{ ...Subtitle, height: "0.5dvh" }}>{status}</p>
      ),
    },
    {
      title: "Action",
      key: "operation",
      render: () => (
        <Space
          size="middle"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => returningAllAtOnce()}
            style={{
              ...Subtitle,
              color: "var(--blue-dark--800)",
              outline: "none",
              margin: "0",
              backgroundColor: "transparent",
              border: "none",
            }}
          >
            Mark all as returned
          </button>
        </Space>
      ),
    },
  ];
  return (
    // <>
      <Table
        showHeader={false}
        columns={footerColumn}
        dataSource={rendering}
        pagination={false}
        className="footer-expanded-table"
      />
      // {/* {openModal && (
      //   <>
      //     <StripeElementUpadatePaymentMethod
      //       clientSecret={ccInfo.client_secret}
      //       paymentIntentId={ccInfo.id}
      //     />
      //     <button
      //       onClick={() => setOpenModal(false)}
      //       style={{ ...GrayButton, margin: "1rem auto", width: "100%" }}
      //     >
      //       <span
      //         style={{ ...GrayButtonText, ...CenteringGrid }}
      //         id="button-text"
      //       >
      //         Cancel
      //       </span>
      //     </button>
      //   </>
      // )} */}
    // {/* </> */}
  );
};

export default FooterExpandedRow;
