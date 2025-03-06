import { Button, message, Popconfirm, Table } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import Lost from "../../../components/icons/credit-card-x.svg";
import ReverseRightArrow from "../../../components/icons/flip-forward.svg";
import ScanIcon from "../../../components/icons/scan.svg";
import Report from "../../../components/icons/table.svg";
import itemReportForClient from "../../../components/notification/email/ItemReportForClient";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../styles/global/GrayButton";
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
  const { user } = useSelector((state) => state.admin);
  const [isLoadingState, setIsLoadingState] = useState(false);
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

  const reportTemplate = {
    customerInfo: dataRendering?.eventInfo[0]?.consumerInfo,
    event: {
      eventInfoDetail: {
        eventName: formattedData[0]?.entireData?.eventSelected[0],
      },
      id: formattedData[0]?.entireData?.event_id,
    },
    paymentIntent: dataRendering?.paymentIntent,
    user: user,
    devicesInfo: [
      ...formattedData.map((item) => {
        return {
          serialNumber: item.serial_number,
          deviceType: item.type,
          status: item.status,
        };
      }),
    ],
    setLoadingState: setIsLoadingState,
  };

  const sendEmailDeviceReport = async () => {
    try {
      setIsLoadingState(true);
      await itemReportForClient(reportTemplate);
      return setIsLoadingState(false);
    } catch (error) {
      message.error(`There was an error. ${error}`);
      return setIsLoadingState(false);
    }
  };
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
      render: () => (
        <div
          style={{
            ...CenteringGrid,
            flexDirection: "column",
            width: "100%",
            gap: "5px",
          }}
        >
          <Button style={{ ...GrayButton, width: "100%" }}>
            <p
              style={{
                ...Subtitle,
                ...CenteringGrid,
                fontWeight: 600,
                color: "var(--gray700)",
              }}
            >
              <img src={ReverseRightArrow} alt="ReverseRightArrow" /> &nbsp;Mark
              selected as returned
            </p>
          </Button>
          <Button style={{ ...GrayButton, width: "100%" }}>
            <p
              style={{
                ...Subtitle,
                ...CenteringGrid,
                fontWeight: 600,
                color: "var(--gray700)",
              }}
            >
              <img src={ScanIcon} alt="ScanIcon" /> &nbsp;Scan-in devices
            </p>
          </Button>
          <Popconfirm
            onConfirm={() => returningAllAtOnce()}
            title="Are you sure?"
          >
            <Button style={{ ...GrayButton, width: "100%" }}>
              <p
                style={{
                  ...Subtitle,
                  ...CenteringGrid,
                  fontWeight: 600,
                  color: "var(--gray700)",
                }}
              >
                <img src={ReverseRightArrow} alt="ReverseRightArrow" />{" "}
                &nbsp;Mark all as returned
              </p>
            </Button>
          </Popconfirm>
        </div>
      ),
    },
    {
      title: "Device",
      render: () => (
        <Button
          loading={isLoadingState}
          style={{ ...GrayButton, width: "100%" }}
          onClick={() => sendEmailDeviceReport()}
        >
          <p
            style={{
              ...Subtitle,
              ...CenteringGrid,
              fontWeight: 600,
              color: "var(--gray700)",
            }}
          >
            <img src={Report} alt="Report" /> &nbsp;Send report to client
          </p>
        </Button>
      ),
    },
    {
      title: "Cost of device",
      dataIndex: "status",
      key: "status",
      render: () => (
        <p style={{ ...Subtitle }}>${Number(2500).toLocaleString()} total</p>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: () => (
        <ul style={{ ...Subtitle }}>
          <li style={{ ...Subtitle }}>{Number(0)} Active</li>
          <li style={{ ...Subtitle }}>{Number(0)} Returned</li>
          <li style={{ ...Subtitle }}>{Number(0)} Lost</li>
        </ul>
      ),
    },
    {
      title: "Deposit",
      dataIndex: "deposit",
      key: "deposit",
      render: () => (
        <div
          style={{
            ...CenteringGrid,
            flexDirection: "column",
            width: "100%",
            gap: "20px",
          }}
        >
          <Button style={{ ...GrayButton, width: "100%" }}>
            <p
              style={{
                ...Subtitle,
                ...CenteringGrid,
                fontWeight: 600,
                color: "var(--gray700)",
              }}
            >
              <img src={Lost} alt="Lost" /> &nbsp;Charge for all lost
            </p>
          </Button>
          <p
            style={{
              ...Subtitle,
              ...CenteringGrid,
              fontWeight: 500,
              color: "var(--gray700)",
            }}
          >
            Credit card ending in: 4567
          </p>
        </div>
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
      rowHoverable={false}
      style={{ width: "100%", padding: 0 }}
    />
  );
};

export default FooterExpandedRow;
