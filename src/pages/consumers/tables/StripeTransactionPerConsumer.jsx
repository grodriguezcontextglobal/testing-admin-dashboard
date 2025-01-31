import { Chip } from "@mui/material";
import { Avatar, Badge, Button, Table } from "antd";
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
import UpDoubleArrow from "../../../components/icons/UpDoubleArrow";
import DownDoubleArrowIcon from "../../../components/icons/DownDoubleArrowIcon";
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
  }, []);//customer.id, customer.uid

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
      title: "Event",
      dataIndex: "eventSelected",
      key: "eventSelected",
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
                color: "var(--Blue-dark-600, #155EEF)",
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
      responsive: ["lg"],
      render: (_, record) => (
        <p style={Subtitle}>
          {record.device} {record.device > 1 ? "devices" : "device"}&nbsp;
          <Badge
            style={{
              display: "flex",
              padding: "2px 8px",
              alignItems: "center",
              borderRadius: "16px",
              background: `${
                record.status === record.device
                  ? "var(--Primary-50, #F9F5FF)"
                  : "var(--Success-50, #ECFDF3)"
              }`,
              mixBlendMode: "multiply",
            }}
          >
            <Chip
              style={{
                backgroundColor: `${
                  record.status === record.device
                    ? "var(--Primary-50, #F9F5FF)"
                    : "var(--Success-50, #ECFDF3)"
                }`,
              }}
              label={
                <p
                  style={{
                    color: `${
                      record.status === record.device
                        ? "var(--Primary-700, #6941C6)"
                        : "var(--success-700, #027A48)"
                    }`,
                    fontFamily: "Inter",
                    fontSize: "12px",
                    fontStyle: "normal",
                    fontWeight: 500,
                    lineHeight: "18px",
                  }}
                >
                  {record.status !== null
                    ? record?.status === record?.device
                      ? "Returned"
                      : "Active"
                    : "Service"}
                </p>
              }
            />
          </Badge>
        </p>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      responsive: ["lg"],
      render: (type, record) => (
        <p style={Subtitle}>
          <Badge
            style={{
              display: "flex",
              padding: "2px 8px",
              alignItems: "center",
              borderRadius: "16px",
              background: `${
                type === "event"
                  ? "var(--Primary-50, #F9F5FF)"
                  : "var(--Success-50, #ECFDF3)"
              }`,
              mixBlendMode: "multiply",
            }}
          >
            <Chip
              style={{
                backgroundColor: `${
                  type === "event"
                    ? "var(--Primary-50, #F9F5FF)"
                    : "var(--Success-50, #ECFDF3)"
                }`,
              }}
              label={
                <p
                  style={{
                    color: `${
                      type === "event"
                        ? "var(--Primary-700, #6941C6)"
                        : "var(--success-700, #027A48)"
                    }`,
                    fontFamily: "Inter",
                    fontSize: "12px",
                    fontStyle: "normal",
                    fontWeight: 500,
                    lineHeight: "18px",
                    textTransform: "capitalize",
                  }}
                >
                  {type === "event"
                    ? record.device > 0
                      ? type
                      : `${type} | Service`
                    : "Lease"}
                </p>
              }
            />
          </Badge>
        </p>
      ),
    },
    {
      title: "",
      dataIndex: "action",
      key: "action",
      responsive: ["md"],
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
    if (props.expanded) {
      return (
        <Button
          onClick={(e) => {
            props.onExpand(props.record, e);
          }}
        >
          <UpDoubleArrow />
        </Button>
      );
    } else {
      return (
        <Button
          onClick={(e) => {
            props.onExpand(props.record, e);
          }}
        >
          <DownDoubleArrowIcon />
        </Button>
      );
    }
  };

  return (
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
      dataSource={finalDataToDisplayIncludeSearchFN()}
      className="table-ant-customized"
      pagination={{
        position: ["bottomCenter"],
      }}
      // style={{ cursor: "pointer" }}
    />
  );
};

StripeTransactionPerConsumer.propTypes = {
  searchValue: PropTypes.string,
};
export default StripeTransactionPerConsumer;
