import { Chip } from "@mui/material";
import { Avatar, Badge, Table } from "antd";
import { groupBy } from "lodash";
import { PropTypes } from "prop-types";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { RightNarrowInCircle } from "../../../components/icons/RightNarrowInCircle";
import {
  onAddEventData,
  onSelectCompany,
  onSelectEvent,
} from "../../../store/slices/eventSlice";
import { onAddPaymentIntentSelected } from "../../../store/slices/stripeSlice";
import { onAddSubscription } from "../../../store/slices/subscriptionSlice";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { DangerButton } from "../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../styles/global/DangerButtonText";
import { Subtitle } from "../../../styles/global/Subtitle";
import "../../../styles/global/ant-table.css";
import ExpandedRow from "./ExpandedRow";
// import UpDoubleArrow from "../../../components/icons/UpDoubleArrow";
// import DownDoubleArrowIcon from "../../../components/icons/DownDoubleArrowIcon";
import { DownNarrow } from "../../../components/icons/DownNarrow";
import { UpNarrowIcon } from "../../../components/icons/UpNarrowIcon";
import RefreshButton from "../../../components/utils/UX/RefreshButton";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
const StripeTransactionPerConsumer = ({ data, searchValue }) => {
  const { user } = useSelector((state) => state.admin);
  const { customer } = useSelector((state) => state.customer);
  const [paymentIntentInfoRetrieved, setPaymentIntentInfoRetrieved] = useState(
    {}
  );
  const [responseData, setResponseData] = useState([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const customerFormat = {
    ...customer,
    id: customer.id ?? customer.uid,
  };

  const retrievePaymentIntentInfo = (props) => {
    return setPaymentIntentInfoRetrieved(props);
  };

  const fetchingAllTransactionPerConsumerRelatedToEvent = async () => {
    return data;
  };

  const fetchingDataPerAllowed = async () => {
    const allTransactionFetching =
      await fetchingAllTransactionPerConsumerRelatedToEvent();
    const result = new Map();
    const groupedData = groupBy(allTransactionFetching, "paymentIntent");
    for (let [key, value] of Object.entries(groupedData)) {
      const respo = await devitrakApi.post("/receiver/receiver-assigned-list", {
        paymentIntent: key,
      });
      const transactionData = respo?.data?.listOfReceivers;
      if (!result.has(key)) {
        result.set(key, [
          {
            eventSelected: value[0]?.eventSelected,
            paymentIntent: key,
            device: transactionData?.length,
            status: Array.isArray(transactionData[0]?.device)
              ? 0
              : transactionData?.reduce(
                  (acc, { device }) =>
                    acc +
                    (device?.status === false || device?.status === "Lost"),
                  0
                ),
            eventInfo: value,
            extra_data: transactionData ?? [],
            timestamp: value[0].created_at,
          },
        ]);
      } else {
        result.set(key, [
          ...result.get(key),
          {
            eventSelected: value[0]?.eventSelected,
            paymentIntent: key,
            device: transactionData?.length,
            status: Array.isArray(transactionData[0]?.device)
              ? 0
              : transactionData?.reduce(
                  (acc, { device }) =>
                    acc +
                    (device?.status === false || device?.status === "Lost"),
                  0
                ),
            eventInfo: value,
            extra_data: transactionData ?? [],
            timestamp: value[0].created_at,
          },
        ]);
      }
    }
    let final = [...result.values().map((item) => item)];
    return setResponseData(final);
  };

  const refetchingAfterReturnDeviceInRow = () => {
    return fetchingDataPerAllowed();
  };

  useEffect(() => {
    fetchingDataPerAllowed();
  }, []); //customer.id, customer.uid

  const reformedSourceData = () => {
    const result = new Set();
    responseData.forEach((value) => {
      result.add({
        eventSelected: value[0]?.eventSelected,
        paymentIntent: value[0]?.paymentIntent,
        device: value[0]?.device,
        status: value[0]?.device > 0 ? value[0]?.status : null,
        eventInfo: value[0].eventInfo,
        type: value[0].eventInfo[0].type,
        date: value[0].timestamp,
      });
    });
    return Array.from(result);
  };

  const addingKeysToExpandRow = () => {
    const result = new Set();
    for (let data of reformedSourceData()) {
      result.add({
        key: data.paymentIntent,
        ...data,
      });
    }
    return Array.from(result);
  };

  const finalDataToDisplayIncludeSearchFN = () => {
    if (searchValue?.length > 0 && addingKeysToExpandRow()?.length > 0) {
      return addingKeysToExpandRow().filter((element) =>
        JSON.stringify(element)
          .toLowerCase()
          .includes(searchValue.toLowerCase())
      );
    }
    return addingKeysToExpandRow();
  };

  const moreDetailFn = async (record) => {
    const eventListQuery = await devitrakApi.post("/event/event-list", {
      company: user.company,
      "eventInfoDetail.eventName": record.eventSelected[0],
    });
    dispatch(
      onSelectEvent(eventListQuery.data.list[0].eventInfoDetail.eventName)
    );
    dispatch(onSelectCompany(eventListQuery.data.list[0].company));
    dispatch(onAddEventData(eventListQuery.data.list[0]));
    dispatch(onAddSubscription(eventListQuery.data.list[0].subscription));
    dispatch(onAddPaymentIntentSelected(record.paymentIntent));
    navigate(
      `/events/event-attendees/${
        customer.uid ?? customer.id
      }/transactions-details`
    );
  };

  const renderingOptionsBasedOnPaymentIntentStatus = (paymentIntent) => {
    if (paymentIntent?.length < 16) {
      return "none";
    } else if (
      (paymentIntent?.length > 15 && String(paymentIntent).includes("cash")) ||
      (paymentIntent?.length > 15 &&
        paymentIntentInfoRetrieved.status !== "requires_capture")
    ) {
      return "none";
    } else {
      return "flex";
    }
  };

  const columns = [
    {
      title: "Transaction date",
      dataIndex: "date",
      key: "date",
      width: "20%",
      responsive: ["xs", "sm", "md", "lg"],
      render: (date) => {
        const weekdayDic = {
          Sun: "Sunday",
          Mon: "Monday",
          Tue: "Tuesday",
          Wed: "Wednesday",
          Thu: "Thursday",
          Fri: "Friday",
          Sat: "Saturday",
        };
        const dateSplit = new Date(date).toString().split(" ");
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <p
              style={{
                ...Subtitle,
                color: "#000",
                fontWeight: 500,
                width: "100%",
                textAlign: "left",
              }}
            >
              {weekdayDic[dateSplit[0]]}&nbsp;
              {dateSplit.slice(1, 4).join(" ")}
            </p>
            <p
              style={{
                ...Subtitle,
                fontSize: "12px",
                width: "100%",
                textAlign: "left",
              }}
            >
              {dateSplit[4]} {dateSplit.slice(6).join(" ")}
            </p>
          </div>
        );
      },
    },
    {
      title: "Event",
      dataIndex: "eventSelected",
      key: "eventSelected",
      responsive: ["md", "lg"],
      render: (eventSelected) => {
        const initials = String(eventSelected).split(" ");
        return (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <Avatar>{initials.map((item) => item[0])}</Avatar>&nbsp;
            <p
              style={{
                color: "var(--blue-dark-600, #155EEF)",
                fontFamily: "Inter",
                fontSize: "14px",
                fontStyle: "normal",
                fontWeight: "400",
                lineHeight: "20px" /* 142.857% */,
              }}
            >
              {eventSelected}
            </p>
          </div>
        );
      },
    },
    {
      title: "Transaction ID",
      dataIndex: "paymentIntent",
      key: "paymentIntent",
      responsive: ["md", "lg"],
      render: (paymentIntent) => {
        const checkPaymentID = String(paymentIntent).split("_");
        return (
          <p
            style={{
              color: "var(--Gray900)", //, #101828
              fontFamily: "Inter",
              fontSize: "14px",
              fontStyle: "normal",
              fontWeight: "400",
              lineHeight: "20px" /* 142.857% */,
            }}
          >
            {checkPaymentID[1] === "cash"
              ? `${checkPaymentID[1]} ${checkPaymentID[2]} ${
                  String(checkPaymentID[4]).split("**")[1]
                }`
              : `${paymentIntent}`}
          </p>
        );
      },
    },
    {
      title: "Devices",
      dataIndex: "device",
      key: "device",
      responsive: ["xs", "sm", "md", "lg"],
      render: (_, record) => (
        <p style={Subtitle}>
          {record.device} {record.device > 1 ? "devices" : "device"}&nbsp;
        </p>
      ),
    },
    {
      title: "",
      dataIndex: "action",
      key: "action",
      responsive: ["xs", "sm", "md", "lg"],
      width: "3%",
      render: (_, record) => {
        const checkPaymentID = String(record.paymentIntent).split("_");
        return (
          <div
            style={{
              display: renderingOptionsBasedOnPaymentIntentStatus(
                record.paymentIntent
              ),
              justifyContent: "flex-end",
              alignItems: "center",
              width: "100%",
              gap: "5px",
            }}
          >
            <button
              style={{
                ...DangerButton,
                // background: "transparent",
                outline: "none",
                display: `${
                  checkPaymentID[1] === "cash" || checkPaymentID[1]?.length < 13
                    ? "none"
                    : "flex"
                }`,
              }}
            >
              <p
                style={{
                  ...DangerButtonText,
                  display: `${
                    checkPaymentID[1] === "cash" ||
                    checkPaymentID[1]?.length < 13
                      ? "none"
                      : "flex"
                  }`,
                  border: "transparent",
                  outline: "none",
                }}
              >
                Capture
              </p>
            </button>

            <button
              style={{
                ...BlueButton,
                // background: "transparent",
                outline: "none",
                display: `${
                  checkPaymentID[1] === "cash" || checkPaymentID[1]?.length < 13
                    ? "none"
                    : "flex"
                }`,
              }}
            >
              <p
                style={{
                  ...BlueButtonText,
                  display: `${
                    checkPaymentID[1] === "cash" ||
                    checkPaymentID[1]?.length < 13
                      ? "none"
                      : "flex"
                  }`,
                  border: "transparent",
                  outline: "none",
                }}
              >
                Release
              </p>
            </button>
            <button
              style={{ background: "transparent", outline: "none" }}
              onClick={() => moreDetailFn(record)}
            >
              <RightNarrowInCircle />
            </button>
          </div>
        );
      },
    },
  ];

  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  const customExpandIcon = (props) => {
    const buttonStyle = (color) => {
      return {
        backgroundColor: color,
      };
    };
    return (
      <p
        onClick={(e) => {
          props.onExpand(props.record, e);
        }}
        key={props.expanded}
        style={{ ...Subtitle, cursor: "pointer" }}
      >
        <Badge
          style={buttonStyle(
            props.expanded ? "var(--gray100)" : "var(--success50)"
          )}
        >
          <Chip
            style={{
              ...CenteringGrid,
              width: "100%",
              backgroundColor: `${
                props.expanded ? "var(--gray100)" : "var(--success50)"
              }`,
            }}
            label={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <p
                  style={{
                    ...Subtitle,
                    color: props.expanded
                      ? "var(--gray700)"
                      : "var(--success700)",
                  }}
                >
                  {props.expanded ? "Close" : "Open"}
                </p>
                {props.expanded ? <UpNarrowIcon /> : <DownNarrow />}
              </div>
            }
          />
        </Badge>
      </p>
    );

  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "2rem auto -0.5rem",
          padding: "15px 24px",
          border: "1px solid var(--gray-200, #eaecf0)",
          borderRadius: "12px 12px 0 0",
          background: "var(--gray-50, #F9F9F9)",
        }}
      >
        <p
          style={{
            ...TextFontSize20LineHeight30,
            fontWeight: 500,
            color: "#000",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          Transactions
        </p>
        <RefreshButton propsFn={refetchingAfterReturnDeviceInRow} />
      </div>
      <Table
        key={customerFormat.id}
        id={customerFormat.id}
        columns={columns}
        expandable={{
          expandedRowKeys,
          onExpand: (expanded, record) => {
            setExpandedRowKeys(expanded ? [record.key] : []);
          },
          expandIcon: (props) => customExpandIcon(props),
          expandRowByClick: false,
          expandedRowRender: (record) => (
            <ExpandedRow
              rowRecord={record}
              refetching={refetchingAfterReturnDeviceInRow}
              paymentIntentInfoRetrieved={retrievePaymentIntentInfo}
            />
          ),
        }}
        expandIconColumnIndex={columns.length - 1}
        dataSource={finalDataToDisplayIncludeSearchFN()}
        className="table-ant-customized"
        pagination={{
          position: ["bottomCenter"],
        }}
      />
    </div>
  );
};

StripeTransactionPerConsumer.propTypes = {
  searchValue: PropTypes.string,
};
export default StripeTransactionPerConsumer;



        {/* <Button
          onAbort={() => {
            refetchingAfterReturnDeviceInRow();
          }}
          style={{
            ...BlueButton,
            width: "fit-content",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={BlueButtonText}>Refresh</p>
        </Button> */}

    // if (props.expanded) {
    //   return (
    //     <Badge
    //       style={buttonStyle("var(--gray100)")}
    //       onClick={(e) => {
    //         props.onExpand(props.record, e);
    //       }}
    //     >
    //       <p style={{ ...Subtitle, color: "var(--gray700)" }}>Close</p>
    //       <UpNarrowIcon />
    //       {/* <UpDoubleArrow /> */}
    //     </Badge>
    //   );
    // } else {
    //   return (
    //     <Button
    //       style={buttonStyle("var(--success50)")}
    //       onclick={props.onExpand}
    //       onClick={(e) => {
    //         props.onExpand(props.record, e);
    //       }}
    //     >
    //       <p style={{ ...Subtitle, color: "var(--success700)" }}>Open</p>
    //       <DownNarrow />
    //       {/* <DownDoubleArrowIcon /> */}
    //     </Button>
    //   );
    // }

              {/* <Badge style={chipStyle(record.status === record.device)}>
            <Chip
              style={{
                backgroundColor: `${
                  record.status === record.device
                    ? "var(--Primary-50, #F9F5FF)"
                    : "var(--Success-50, #ECFDF3)"
                }`,
              }}
              label={
                <p style={chipTextStyle(record.status === record.device)}>
                  {record.status !== null
                    ? record?.status === record?.device
                      ? "Returned"
                      : "Active"
                    : "Service"}
                </p>
              }
            />
          </Badge> */}

          