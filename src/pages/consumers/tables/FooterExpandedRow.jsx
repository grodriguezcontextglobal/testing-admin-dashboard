import { Button, message, Popconfirm, Spin, Table } from "antd";
import { groupBy } from "lodash";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import Lost from "../../../components/icons/credit-card-x.svg";
import ReverseRightArrow from "../../../components/icons/flip-forward.svg";
import ScanIcon from "../../../components/icons/scan.svg";
import Report from "../../../components/icons/table.svg";
import itemReportForClient from "../../../components/notification/email/ItemReportForClient";
import { checkArray } from "../../../components/utils/checkArray";
import ExpressCheckoutItems from "../../../components/utils/ExpressCheckoutItems";
import returningItemsInBulkMethod from "../../../components/utils/ReturnItemsInBulk";
import {
  onAddEventData,
  onAddEventInfoDetail,
  onSelectCompany,
  onSelectEvent,
} from "../../../store/slices/eventSlice";
import { onReceiverObjectToReplace } from "../../../store/slices/helperSlice";
import {
  onAddDevicesAssignedInPaymentIntent,
  onAddPaymentIntentSelected,
} from "../../../store/slices/stripeSlice";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../styles/global/GrayButton";
import { Subtitle } from "../../../styles/global/Subtitle";
import ChargeOptionsModal from "../action/chargeAllDevicesFolder/ChargeOptionsModal";
import "../localStyles.css";
import PaymentIcon from "../../../components/icons/paymentIcon";
import WithdrawIcon from "../../../components/icons/WithdrawIcon";
import { useMediaQuery } from "@uidotdev/usehooks";
const FooterExpandedRow = ({
  dataRendering,
  formattedData,
  paymentIntentInfoRetrieved,
  selectedItems,
  setSelectedItems,
  refetchingDevicePerTransaction,
  setOpenModalReleasingDeposit,
  setOpenModalCapturingDeposit,
  assignedItemsPerTransactionData,
}) => {
  const { user } = useSelector((state) => state.admin);
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [openChargeAllLostDevicesModal, setOpenChargeAllLostDevicesModal] =
    useState(false);
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
    await formatItemsInfoAsProps();
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
  const dispatch = useDispatch();
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
      return "Deposit's method: free";
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

  const lostFeeChargeCustomer = async (props) => {
    // setOpenModal(true);
    const responseEvent = await devitrakApi.post("/event/event-list", {
      company: user.company,
      "eventInfoDetail.eventName": props[0].entireData.eventSelected[0],
    });
    const receiversList = groupBy(
      assignedItemsPerTransactionData,
      "device.status"
    )["Lost"];
    dispatch(onAddEventData(checkArray(responseEvent.data?.list)));
    dispatch(onAddEventInfoDetail(props[0].entireData.eventSelected[0]));
    dispatch(onSelectCompany(user.company));
    dispatch(onSelectEvent(props[0].entireData.eventSelected[0]));
    dispatch(
      onReceiverObjectToReplace([
        ...receiversList.map((item) => ({
          serialNumber: item.device.serialNumber,
          deviceType: item.device.deviceType,
          status: item.device.status,
        })),
      ])
    );
    dispatch(onAddDevicesAssignedInPaymentIntent(receiversList));
    dispatch(
      onAddPaymentIntentSelected(props[0].transactionData.paymentIntent)
    );
    return setOpenChargeAllLostDevicesModal(true);
  };

  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );

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
        <div
          style={{
            ...CenteringGrid,
            flexDirection: "column",
            width: "100%",
            gap: "5px",
          }}
        >
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
          <Button
            loading={isLoadingState}
            style={{ ...GrayButton, width: "100%" }}
            onClick={() => setOpenModalCapturingDeposit(true)}
          >
            <p
              style={{
                ...Subtitle,
                ...CenteringGrid,
                fontWeight: 600,
                color: "var(--gray700)",
              }}
            >
              {/* <img src={Report} alt="Report" /> &nbsp; */}
              <PaymentIcon />
              &nbsp;Capture deposit
            </p>
          </Button>
          <Button
            loading={isLoadingState}
            style={{ ...GrayButton, width: "100%" }}
            onClick={() => setOpenModalReleasingDeposit(true)}
          >
            <p
              style={{
                ...Subtitle,
                ...CenteringGrid,
                fontWeight: 600,
                color: "var(--gray700)",
              }}
            >
              {/* <img src={Report} alt="Report" /> &nbsp; */}
              <WithdrawIcon />
              &nbsp;Release deposit
            </p>
          </Button>
        </div>
      ),
    },
    {
      title: "Cost of device",
      dataIndex: "status",
      key: "status",
      responsive: ["md", "lg"],
      render: (_, record) => {
        const paymentIntent = record.data[0].eventInfo[0].paymentIntent;
        const retrieveAmount = () => {
          if (
            paymentIntent.length > 15 &&
            String(paymentIntent).includes("cash")
          ) {
            const paymentIntent = record.data[0].eventInfo[0].paymentIntent;
            const splitting = String(paymentIntent).split(":");
            const amountRetrieved = String(splitting[1]).split("_")[0];
            return String(amountRetrieved).split("$")[1];
          } else if (paymentIntent.length < 16) {
            return 0;
          } else {
            return String(ccInfo.amount).slice(0, -2) ?? 0;
          }
        };
        return (
          <p style={{ ...Subtitle }}>
            ${Number(retrieveAmount()).toLocaleString()} total
          </p>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      responsive: ["md", "lg"],
      render: () => {
        const groupingByStatus = groupBy(transactionDeviceData, "status");
        const lostNumber = groupingByStatus["lost"] || groupingByStatus["Lost"];
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
                ? Number(lostNumber.length)
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
      render: () => {
        const lostItemsList = groupBy(formattedData, "status")["Lost"];
        return (
          <div
            style={{
              ...CenteringGrid,
              flexDirection: "column",
              width: "100%",
              gap: "20px",
            }}
          >
            <Popconfirm
              title="Are you sure that you want to charge consumer for all devices marked as lost?"
              onConfirm={() => lostFeeChargeCustomer(lostItemsList)}
            >
              <Button
                style={{ ...GrayButton, width: "100%" }}
                // onClick={() => lostFeeChargeCustomer(lostItemsList)}
              >
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
            </Popconfirm>{" "}
            <p
              style={{
                ...Subtitle,
                ...CenteringGrid,
                fontWeight: 500,
                color: "var(--gray700)",
              }}
            >
              {dataToBeRendered()}
            </p>
          </div>
        );
      },
    },
  ];

  const footerColumnMobileScreen = [
    {
      title: "Deposit",
      dataIndex: "deposit",
      key: "deposit",
      render: () => {
        const lostItemsList = groupBy(formattedData, "status")["Lost"];

        return (
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
            <Button
              loading={isLoadingState}
              style={{ ...GrayButton, width: "100%" }}
              onClick={() => setOpenModalCapturingDeposit(true)}
            >
              <p
                style={{
                  ...Subtitle,
                  ...CenteringGrid,
                  fontWeight: 600,
                  color: "var(--gray700)",
                }}
              >
                {/* <img src={Report} alt="Report" /> &nbsp; */}
                <PaymentIcon />
                &nbsp;Capture deposit
              </p>
            </Button>
            <Button
              loading={isLoadingState}
              style={{ ...GrayButton, width: "100%" }}
              onClick={() => setOpenModalReleasingDeposit(true)}
            >
              <p
                style={{
                  ...Subtitle,
                  ...CenteringGrid,
                  fontWeight: 600,
                  color: "var(--gray700)",
                }}
              >
                {/* <img src={Report} alt="Report" /> &nbsp; */}
                <WithdrawIcon />
                &nbsp;Release deposit
              </p>
            </Button>
            <Popconfirm
              title="Are you sure that you want to charge consumer for all devices marked as lost?"
              onConfirm={() => lostFeeChargeCustomer(lostItemsList)}
            >
              <Button
                style={{ ...GrayButton, width: "100%" }}
                // onClick={() => lostFeeChargeCustomer(lostItemsList)}
              >
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
            </Popconfirm>{" "}
          </div>
        );
      },
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
  }, [refetchingDevicePerTransaction]);

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
        columns={
          isSmallDevice || isMediumDevice
            ? footerColumnMobileScreen
            : footerColumn
        }
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
      {openChargeAllLostDevicesModal && (
        <ChargeOptionsModal
          openChargeAllLostDevicesModal={openChargeAllLostDevicesModal}
          setOpenChargeAllLostDevicesModal={setOpenChargeAllLostDevicesModal}
        />
      )}
    </>
  );
};

export default FooterExpandedRow;
