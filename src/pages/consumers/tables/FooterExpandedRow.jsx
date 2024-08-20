import { Space, Table } from "antd";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../styles/global/GrayButton";
import GrayButtonText from "../../../styles/global/GrayButtonText";
import { Subtitle } from "../../../styles/global/Subtitle";

const FooterExpandedRow = ({
  displayTernary,
  handleReturnSingleDevice,
  handleLostSingleDevice,
  dataRendering,
}) => {
  const footerColumn = [
    {
      dataIndex: "deposit",
      key: "deposit",
      render: (deposit) => <p style={Subtitle}>{deposit}</p>,
    },
    {
      dataIndex: "serial_number",
      key: "serial_number",
      render: (serial_number) => <p style={Subtitle}>{serial_number}</p>,
    },
    {
      dataIndex: "status",
      key: "status",
    },
    {
      key: "operation",
      render: (record) => (
        <Space
          size="middle"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => handleReturnSingleDevice(record)}
            style={{
              ...BlueButton,
              display: `${
                record.status === "Lost"
                  ? "none"
                  : record.status
                  ? "flex"
                  : "none"
              }`,
            }}
          >
            <p style={BlueButtonText}>Mark as returned</p>
          </button>
          <button
            onClick={() => handleLostSingleDevice(record)}
            style={{
              ...GrayButton,
              display: `${
                record.status === "Lost"
                  ? "none"
                  : record.status
                  ? "flex"
                  : "none"
              }`,
            }}
          >
            <p
              style={{
                ...GrayButtonText,
                color: `${
                  record.status
                    ? GrayButtonText.color
                    : "var(--disabled0gray-button-text)"
                }`,
              }}
            >
              Mark as lost
            </p>
          </button>
        </Space>
      ),
    },
  ];

  const dataToBeRendered = () => {
    if (dataRendering.paymentIntent.length < 16) {
      return "Free deposit transaction";
    } else if (
      dataRendering.paymentIntent.length > 15 &&
      String(dataRendering.paymentIntent).includes("cash")
    ) {
      return "Deposit's method: cash";
    } else {
      return "Credit card ending in: 4567";
    }
  };

  const rendering = [
    {
      deposit: dataToBeRendered(),
      status: false,
      serial_number: "",
    },
  ];
  return (
    <Table
      showHeader={false}
      columns={footerColumn}
      dataSource={rendering}
      pagination={false}
    />
  );
};

export default FooterExpandedRow;
