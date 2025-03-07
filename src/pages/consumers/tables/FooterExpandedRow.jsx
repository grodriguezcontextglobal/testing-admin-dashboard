import { Button, message, Popconfirm, Spin, Table, Tooltip } from "antd";
import { groupBy } from "lodash";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import Lost from "../../../components/icons/credit-card-x.svg";
import ReverseRightArrow from "../../../components/icons/flip-forward.svg";
import ScanIcon from "../../../components/icons/scan.svg";
import Report from "../../../components/icons/table.svg";
import itemReportForClient from "../../../components/notification/email/ItemReportForClient";
import ExpressCheckoutItems from "../../../components/utils/ExpressCheckoutItems";
import returningItemsInBulkMethod from "../../../components/utils/ReturnItemsInBulk";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../styles/global/GrayButton";
import { Subtitle } from "../../../styles/global/Subtitle";
import "../localStyles.css";
const FooterExpandedRow = ({
  dataRendering,
  formattedData,
  paymentIntentInfoRetrieved,
  selectedItems,
  setSelectedItems,
  refetchingDevicePerTransaction,
}) => {
  const { user } = useSelector((state) => state.admin);
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [selectedItemsToMarkAsReturned, setSelectedItemsToMarkAsReturned] =
    useState([]);
  const returningAllItemsAtOnce = async (props) => {
    setIsLoadingState(true);
    await returningItemsInBulkMethod({
      user,
      event: {
        eventInfoDetail: { eventName: dataRendering?.eventSelected },
        id: dataRendering?.eventInfo[0]?.id,
      },
      selectedItems: props,
      setSelectedItems: setSelectedItems,
      loadingStatus: isLoadingState,
    });
    await refetchingDevicePerTransaction();
    await formatItemsInfoAsProps()
    return setIsLoadingState(false);
  };
  const [ccInfo, setCcInfo] = useState([]);
  const [expressCheckoutModal, setExpressCheckoutModal] = useState(false);
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
            <Popconfirm
              onConfirm={() =>
                returningAllItemsAtOnce(selectedItemsToMarkAsReturned)
              }
              title="Are you sure?"
            >
            <Button
              loading={isLoadingState}
              style={{ ...GrayButton, width: "100%" }}
            >
              <p
                style={{
                  ...Subtitle,
                  ...CenteringGrid,
                  fontWeight: 600,
                  color: "var(--gray700)",
                }}
              >
                <img src={ReverseRightArrow} alt="ReverseRightArrow" />{" "}
                &nbsp;Mark selected as returned
              </p>
            </Button>
            </Popconfirm>
          <Button
            style={{ ...GrayButton, width: "100%" }}
            onClick={() => setExpressCheckoutModal(true)}
          >
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
            onConfirm={() => returningAllItemsAtOnce(transactionDeviceData)}
            title="Are you sure?"
          >
            <Button
              loading={isLoadingState}
              style={{ ...GrayButton, width: "100%" }}
            >
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
      render: () => {
        const groupingByStatus = groupBy(transactionDeviceData, "status");
        return (
          <ul style={{ ...Subtitle }}>
            <li style={{ ...Subtitle }}>
              {groupingByStatus[true]
                ? Number(groupingByStatus[true].length)
                : 0}{" "}
              Active
            </li>
            <li style={{ ...Subtitle }}>
              {groupingByStatus[false]
                ? Number(groupingByStatus[false].length)
                : 0}{" "}
              Returned
            </li>
            <li style={{ ...Subtitle }}>
              {groupingByStatus["lost"] || groupingByStatus["Lost"]
                ? Number(groupingByStatus["lost"].length)
                : 0}{" "}
              Lost
            </li>
          </ul>
        );
      },
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
          <Tooltip title="Still in construction.">
            <Button disabled style={{ ...GrayButton, width: "100%" }}>
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
          </Tooltip>{" "}
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

  const [transactionDeviceData, setTransactionDeviceData] = useState([]);
  const formatItemsInfoAsProps = async () => {
    const response = await devitrakApi.post(
      "/receiver/receiver-assigned-list",
      {
        user: dataRendering?.eventInfo[0]?.consumerInfo.email,
        company: user.companyData.id,
        eventSelected: formattedData[0]?.entireData?.eventSelected[0],
        paymentIntent: dataRendering?.paymentIntent,
      }
    );
    return setTransactionDeviceData([
      ...response.data.listOfReceivers.map((item) => item.device),
    ]);
  };

  useEffect(() => {
    formatItemsInfoAsProps();
  }, []);

  useMemo(() => {
    let result = new Set();
    transactionDeviceData.forEach((item) => {
      if (
        selectedItems.some(
          (c) =>
            c.serial_number === item.serialNumber && c.type === item.deviceType
        )
      ) {
        result.add(item);
      }
    });
    return setSelectedItemsToMarkAsReturned(Array.from(result));
  }, [selectedItems]);

  return (
    <>
      <Table
        showHeader={false}
        columns={footerColumn}
        dataSource={rendering}
        pagination={false}
        className="footer-expanded-table"
        rowHoverable={false}
        style={{ width: "100%", padding: 0 }}
      />
      {isLoadingState && <Spin indicator={<Loading />} fullscreen />}
      {expressCheckoutModal && (
        <ExpressCheckoutItems
          openReturnDeviceBulkModal={expressCheckoutModal}
          setOpenReturnDeviceInBulkModal={setExpressCheckoutModal}
          event={reportTemplate.event}
          user={user}
          refetching={null}
          selectedItems={transactionDeviceData}
          setSelectedItems={setSelectedItems}
          emailNotification={sendEmailDeviceReport}
          refetchingDevicePerTransaction={refetchingDevicePerTransaction}
        />
      )}
    </>
  );
};

export default FooterExpandedRow;
