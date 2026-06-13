import { useQueryClient } from "@tanstack/react-query";
import { Avatar } from "antd";
import { groupBy } from "lodash";
import { PropTypes } from "prop-types";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import TableHeader from "../../../components/UX/TableHeader";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../components/UX/buttons/DangerButton";
import ExpandableTable from "../../../components/UX/tables/ExpandableTable";
import { DownNarrow } from "../../../components/icons/DownNarrow";
// import { RightNarrowInCircle } from "../../../components/icons/RightNarrowInCircle";
import { UpNarrowIcon } from "../../../components/icons/UpNarrowIcon";
import RefreshButton from "../../../components/utils/UX/RefreshButton";
import {
  onAddEventData,
  onSelectCompany,
  onSelectEvent,
} from "../../../store/slices/eventSlice";
import { onAddPaymentIntentSelected } from "../../../store/slices/stripeSlice";
import { onAddSubscription } from "../../../store/slices/subscriptionSlice";
import { Subtitle } from "../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import "../../../styles/global/ant-table.css";
import ExpandedRow from "./ExpandedRow";

const StripeTransactionPerConsumer = ({ data, searchValue }) => {
  const { user } = useSelector((state) => state.admin);
  const { customer } = useSelector((state) => state.customer);
  const [paymentIntentInfoRetrieved, setPaymentIntentInfoRetrieved] = useState(
    {},
  );
  const [responseData, setResponseData] = useState([]);
  const queryClient = useQueryClient();
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
    const paymentIntentList = [...Object.keys(groupedData)];
    const respo = await devitrakApi.post("/receiver/all-transaction-by-event-and-consumer", {
      paymentIntentList,
      company: user.companyData.id
    })

    respo?.data?.listOfReceivers?.forEach((item) => {
      const key = item.paymentIntent
      const value = groupedData[key]

      const transactionData = respo?.data?.listOfReceivers?.filter((item) => item.paymentIntent === key)
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
                0,
              ),
            eventInfo: value,
            extra_data: transactionData ?? [],
            timestamp: value[0].created_at,
            cost: value[0].device[0].deviceValue,
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
                0,
              ),
            eventInfo: value,
            extra_data: transactionData ?? [],
            timestamp: value[0].created_at,
            cost: value[0].device[0].deviceValue,
          },
        ]);
      }
    })
    // for (let [key, value] of Object.entries(groupedData)) {
    //   const respo = await devitrakApi.post("/receiver/receiver-assigned-list", {
    //     paymentIntent: key,
    //   });
    //   const transactionData = respo?.data?.listOfReceivers;
    //   if (!result.has(key)) {
    //     result.set(key, [
    //       {
    //         eventSelected: value[0]?.eventSelected,
    //         paymentIntent: key,
    //         device: transactionData?.length,
    //         status: Array.isArray(transactionData[0]?.device)
    //           ? 0
    //           : transactionData?.reduce(
    //             (acc, { device }) =>
    //               acc +
    //               (device?.status === false || device?.status === "Lost"),
    //             0,
    //           ),
    //         eventInfo: value,
    //         extra_data: transactionData ?? [],
    //         timestamp: value[0].created_at,
    //         cost: value[0].device[0].deviceValue,
    //       },
    //     ]);
    //   } else {
    //     result.set(key, [
    //       ...result.get(key),
    //       {
    //         eventSelected: value[0]?.eventSelected,
    //         paymentIntent: key,
    //         device: transactionData?.length,
    //         status: Array.isArray(transactionData[0]?.device)
    //           ? 0
    //           : transactionData?.reduce(
    //             (acc, { device }) =>
    //               acc +
    //               (device?.status === false || device?.status === "Lost"),
    //             0,
    //           ),
    //         eventInfo: value,
    //         extra_data: transactionData ?? [],
    //         timestamp: value[0].created_at,
    //         cost: value[0].device[0].deviceValue,
    //       },
    //     ]);
    //   }
    // }
    let final = [...result.values().map((item) => item)];
    return setResponseData(final);
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchingDataPerAllowed();
    return () => {
      controller.abort();
    };
  }, [customer.id, customer.uid, data]); // Add dependencies to trigger refresh

  const refetchingAfterReturnDeviceInRow = async () => {
    await queryClient.invalidateQueries(["transactionsList"]);
    await queryClient.invalidateQueries(["receiverList"]);
    return fetchingDataPerAllowed();
  };

  // Update the moreDetailFn to refresh data after actions
  const moreDetailFn = async (record) => {
    try {
      const eventListQuery = await devitrakApi.post("/event/event-list", {
        company: user.company,
        "eventInfoDetail.eventName": record.eventSelected[0],
      });
      dispatch(
        onSelectEvent(eventListQuery.data.list[0].eventInfoDetail.eventName),
      );
      dispatch(onSelectCompany(eventListQuery.data.list[0].company));
      dispatch(onAddEventData(eventListQuery.data.list[0]));
      dispatch(onAddSubscription(eventListQuery.data.list[0].subscription));
      dispatch(onAddPaymentIntentSelected(record.paymentIntent));
      navigate(
        `/events/event-attendees/${customer.uid ?? customer.id
        }/transactions-details`,
      );
    } catch (error) {
      console.error("Error fetching event details:", error);
    }
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
              ? `${checkPaymentID[1]} ${checkPaymentID[2]} ${String(checkPaymentID[4]).split("**")[1]
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
      render: (_, record) => {
        const checkPaymentID = String(record.paymentIntent).split("_");
        return (
          <div
            style={{
              display: renderingOptionsBasedOnPaymentIntentStatus(
                record.paymentIntent,
              ),
              justifyContent: "flex-end",
              alignItems: "center",
              width: "100%",
              gap: "5px",
            }}
          >
            <DangerButtonComponent
              disabled={
                checkPaymentID[1] === "cash" || checkPaymentID[1]?.length < 13
              }
              title={"Capture"}
              func={() => null}
            />
            <BlueButtonComponent
              disabled={
                checkPaymentID[1] === "cash" || checkPaymentID[1]?.length < 13
              }
              title={"Release"}
              func={() => null}
            />
          </div>
        );
      },
    },
  ];

  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  const customExpandIcon = (props) => {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          props.onExpand(props.record, e);
          moreDetailFn(props.record)
        }}
        style={{
          border: "1px solid #D0D5DD",
          background: props.expanded ? "#344054" : "#fff",
          borderRadius: "9999px",
          padding: "6px 14px",
          fontSize: "14px",
          lineHeight: "20px",
          color: props.expanded ? "#fff" : "#475467",
          fontWeight: props.expanded ? 500 : 400,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          whiteSpace: "nowrap",
          width:"fit-content"
        }}
      >
        {props.expanded ? "Close" : "Open"}
        {props.expanded ? <UpNarrowIcon /> : <DownNarrow />}
      </button>
    );
  };

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
    const data = addingKeysToExpandRow();
    if (!searchValue) return data;

    return data.filter((item) => {
      const searchLower = searchValue.toLowerCase();
      return (
        item.eventSelected[0]?.toLowerCase().includes(searchLower) ||
        item.paymentIntent?.toLowerCase().includes(searchLower) ||
        new Date(item.date).toLocaleString().toLowerCase().includes(searchLower)
      );
    });
  };
  const headerTitleStyle = {
    ...TextFontsize18LineHeight28,
    fontWeight: 600,
    color: "#344054",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
  };
  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <TableHeader
        leftCta={<p style={headerTitleStyle}>Transactions</p>}
        rightCta={<RefreshButton propsFn={refetchingAfterReturnDeviceInRow} />}
      />
      <ExpandableTable
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
        enablePagination={true}
        pageSize={10}
      />
    </div>
  );
};

StripeTransactionPerConsumer.propTypes = {
  searchValue: PropTypes.string,
};
export default StripeTransactionPerConsumer;