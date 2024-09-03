import { Space, Table } from "antd";
import { useEffect, useState } from "react";
import { devitrakApi } from "../../../api/devitrakApi";
import { Subtitle } from "../../../styles/global/Subtitle";
import "../localStyles.css";
const FooterExpandedRow = ({
  handleReturnSingleDevice,
  handleLostSingleDevice,
  dataRendering,
  returningDevice,
  formattedData
}) => {
  const returningAllAtOnce = () => {
    for (let data of formattedData) {
      returningDevice(data);
    }
  };
  const [ccInfo, setCcInfo] = useState([]);
  const retrieveCCInfo = async () => {
    const resp = await devitrakApi
      .get(`/stripe/payment_intents/${dataRendering.paymentIntent}`)
      .then((response) => response.data);
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
      data: [],
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
      dataIndex: "serial_number",
      key: "serial_number",
      render: (serial_number) => (
        <p style={{ ...Subtitle, height: "0.5dvh" }}>{serial_number}</p>
      ),
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
          <p
            onClick={() => returningAllAtOnce()}
            style={{ ...Subtitle, color: "var(--blue-dark--800)" }}
          >
            Mark all as returned
          </p>
          {/* <p
            onClick={() => handleLostSingleDevice(record)}
            style={{ ...Subtitle, color: "var(--blue-dark--800)" }}
          >
            Mark all as lost
          </p> */}
        </Space>
      ),
    },
  ];
  return (
    <Table
      showHeader={false}
      columns={footerColumn}
      dataSource={rendering}
      pagination={false}
      className="footer-expanded-table"
    />
  );
};

export default FooterExpandedRow;
