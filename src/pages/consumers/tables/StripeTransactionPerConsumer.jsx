import { Icon } from "@iconify/react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar } from "antd";
import { groupBy } from "lodash";
import { PropTypes } from "prop-types";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import TableHeader from "../../../components/UX/TableHeader";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../components/UX/buttons/DangerButton";
import EmptyState from "../../../components/UX/emptyState/EmptyState";
import ExpandableTable from "../../../components/UX/tables/ExpandableTable";
import { DownNarrow } from "../../../components/icons/DownNarrow";
import { RightNarrowInCircle } from "../../../components/icons/RightNarrowInCircle";
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

const searchInputStyle = {
  height: "36px",
  padding: "0 32px 0 34px",
  border: "1px solid var(--gray-300, #c6c8bf)",
  borderRadius: "8px",
  fontSize: "14px",
  fontFamily: "Inter",
  color: "var(--gray-900, #171d1a)",
  outline: "none",
  width: "200px",
  background: "#fff",
  boxShadow: "var(--shadow-xs)",
};

const StripeTransactionPerConsumer = ({ data, refetching }) => {
  const { register, watch, setValue } = useForm();
  const searchValue = watch("searchEvent") ?? "";
  const { user } = useSelector((state) => state.admin);
  const { customer } = useSelector((state) => state.customer);
  const [responseData, setResponseData] = useState([]);
  const [stripeStatusMap, setStripeStatusMap] = useState({});
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const customerFormat = {
    ...customer,
    id: customer.id ?? customer.uid,
  };

  const retrievePaymentIntentInfo = (paymentIntent) => {
    if (paymentIntent?.id && paymentIntent?.status) {
      setStripeStatusMap((prev) => ({
        ...prev,
        [paymentIntent.id]: paymentIntent.status,
      }));
    }
  };

  const fetchStripeStatusesForPaymentIntents = async (paymentIntentIds) => {
    await Promise.all(
      paymentIntentIds
        .filter((pi) => pi?.length >= 16 && !String(pi).includes("cash"))
        .map(async (pi) => {
          try {
            const res = await devitrakApi.get(`/stripe/payment_intents/${pi}`);
            const status = res?.data?.paymentIntent?.status;
            if (status) {
              setStripeStatusMap((prev) => ({ ...prev, [pi]: status }));
            }
          } catch {
            // skip individual failures
          }
        })
    );
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
    // NOTE: "/receiver/all-transaction-by-event-and-consumer" does not exist
    // on the backend (it 404'd on every load). receiver-assigned-list is a
    // generic Receivers.find(body) that returns the same {listOfReceivers}.
    const respo = await devitrakApi.post("/receiver/receiver-assigned-list", {
      paymentIntent: { $in: paymentIntentList },
      company: user.companyData.id,
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

  // Fetch live Stripe statuses so Capture/Release buttons reflect each
  // card payment intent's current state.
  useEffect(() => {
    const paymentIntents = Object.keys(groupBy(data, "paymentIntent"));
    if (paymentIntents.length > 0) {
      fetchStripeStatusesForPaymentIntents(paymentIntents);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const refetchingAfterReturnDeviceInRow = async () => {
    await queryClient.invalidateQueries({ queryKey: ["transactionsList"] });
    await queryClient.invalidateQueries({ queryKey: ["receiverList"] });
    if (refetching) refetching();
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
                color: "var(--gray-900, #171d1a)",
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
              color: "var(--gray-900, #171d1a)",
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
        const paymentIntent = record.paymentIntent;

        // Free transactions (pi_ auto-generated, length < 16): no buttons
        if (!paymentIntent || paymentIntent.length < 16) return null;

        const isCash = String(paymentIntent).includes("cash");

        if (isCash) {
          // Cash: hide buttons if transaction is inactive
          if (record.eventInfo?.[0]?.active === false) return null;
          return (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "flex-start",
                width: "100%",
                gap: "5px",
              }}
            >
              <DangerButtonComponent title={"Capture"} func={() => null} />
              <BlueButtonComponent title={"Release"} func={() => null} />
              <button
                style={{ background: "transparent", outline: "none" }}
                onClick={() => moreDetailFn(record)}
              >
                <RightNarrowInCircle />
              </button>
            </div>
          );
        }

        // Card (Stripe): gray out when status ≠ requires_capture
        const stripeStatus = stripeStatusMap[paymentIntent];
        const isActive = stripeStatus === "requires_capture";

        return (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "flex-start",
              width: "100%",
              gap: "5px",
            }}
          >
            <DangerButtonComponent
              disabled={!isActive}
              title={"Capture"}
              func={() => null}
            />
            <BlueButtonComponent
              disabled={!isActive}
              title={"Release"}
              func={() => null}
            />
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
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          props.onExpand(props.record, e);
        }}
        style={{
          border: "1px solid var(--gray-300, #c6c8bf)",
          background: props.expanded ? "var(--gray-700, #484d47)" : "#fff",
          borderRadius: "9999px",
          padding: "6px 14px",
          fontSize: "14px",
          lineHeight: "20px",
          color: props.expanded ? "#fff" : "var(--gray-600, #5d615a)",
          fontWeight: props.expanded ? 500 : 400,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          whiteSpace: "nowrap",
          width: "fit-content"
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
    color: "var(--gray-900, #171d1a)",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    margin: 0,
  };
  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <TableHeader
        leftCta={
          <p style={headerTitleStyle}>Transactions</p>
        }
        rightCta={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ position: "relative" }}>
              <Icon
                icon="radix-icons:magnifying-glass"
                color="var(--gray-500, #777b73)"
                width={16}
                height={16}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
              <input
                {...register("searchEvent")}
                type="text"
                placeholder="Search a transaction here"
                data-testid="transaction-search"
                style={searchInputStyle}
              />
              {searchValue.length > 0 && (
                <Icon
                  icon="ic:baseline-delete-forever"
                  color="var(--gray-500, #777b73)"
                  width={18}
                  height={18}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                  }}
                  onClick={() => setValue("searchEvent", "")}
                />
              )}
            </div>
            <RefreshButton propsFn={refetchingAfterReturnDeviceInRow} />
          </div>
        }
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
        locale={{
          emptyText: (
            <EmptyState
              compact
              icon="tabler:receipt-off"
              title="No transactions"
              description="This consumer has no transactions yet. Assign a device to create one."
            />
          ),
        }}
      />
    </div>
  );
};

StripeTransactionPerConsumer.propTypes = {
  data: PropTypes.array,
  refetching: PropTypes.func,
};
export default StripeTransactionPerConsumer;