import { Chip } from "@mui/material";
import { Avatar, Badge, Table } from "antd";
import { PropTypes } from "prop-types";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { RightNarrowInCircle } from "../../../components/icons/Icons";
import {
  onAddEventData,
  onSelectCompany,
  onSelectEvent,
} from "../../../store/slices/eventSlice";
import { onAddPaymentIntentSelected } from "../../../store/slices/stripeSlice";
import { onAddSubscription } from "../../../store/slices/subscriptionSlice";
import { Subtitle } from "../../../styles/global/Subtitle";
import "../../../styles/global/ant-table.css";
import ExpandedRow from "./ExpandedRow";
import { DangerButtonText } from "../../../styles/global/DangerButtonText";
import { DangerButton } from "../../../styles/global/DangerButton";
const StripeTransactionPerConsumer = ({ searchValue }) => {
  const { user } = useSelector((state) => state.admin);
  const { eventsPerAdmin } = useSelector((state) => state.event);
  const { customer } = useSelector((state) => state.customer);
  const [responsedData, setResponsedData] = useState([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  //refactoring -->>
  const avoidDuplicatedEventsPerAdmin = () => {
    const result = new Set();
    if (eventsPerAdmin.active) {
      for (let data of eventsPerAdmin.active) {
        const toString = JSON.stringify(data);
        if (!result.has(toString)) {
          result.add(toString);
        }
      }
    }
    if (eventsPerAdmin.completed) {
      for (let data of eventsPerAdmin.completed) {
        const toString = JSON.stringify(data);
        if (!result.has(toString)) {
          result.add(toString);
        }
      }
    }
    return Array.from(result);
  };
  const fetchingDataPerAllowed = async () => {
    const result = new Map();
    if (avoidDuplicatedEventsPerAdmin().length > 0) {
      for (let data of avoidDuplicatedEventsPerAdmin()) {
        const parsing = JSON.parse(data);
        if (
          customer.data.eventSelected.some(
            (element) => element === parsing.eventInfoDetail.eventName
          ) &&
          customer.data.provider.some((element) => element === parsing.company)
        ) {
          const respo = await devitrakApi.post(
            "/receiver/receiver-assigned-list",
            {
              provider: parsing.company,
              user: customer.email,
              eventSelected: parsing.eventInfoDetail.eventName,
            }
          );
          if (respo.data) {
            if (respo.data.listOfReceivers.length > 0) {
              for (let data of respo.data.listOfReceivers) {
                if (!result.has(data.paymentIntent)) {
                  result.set(data.paymentIntent, [data]);
                } else {
                  result.set(data.paymentIntent, [
                    ...result.get(data.paymentIntent),
                    data,
                  ]);
                }
              }
            }
          }
        }
      }
    }
    return setResponsedData(result);
  };

  const refetchingAfterReturnDeviceInRow = () => {
    return fetchingDataPerAllowed();
  };
  useEffect(() => {
    const controller = new AbortController();
    fetchingDataPerAllowed();
    return () => {
      controller.abort();
    };
  }, []);

  const reformedSourceData = () => {
    const result = new Set();
    responsedData.forEach((value) => {
      result.add({
        eventSelected: value[0].eventSelected,
        paymentIntent: value[0].paymentIntent,
        device: value.length,
        status: value.reduce(
          (acc, { device }) =>
            acc + (device.status === false || device.status === "Lost"),
          0
        ),
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
      return addingKeysToExpandRow().filter(
        (element) =>
          String(element.eventSelected)
            .toLowerCase()
            .includes(String(searchValue).toLowerCase()) ||
          String(element.paymentIntent)
            .toLowerCase()
            .includes(String(searchValue).toLowerCase())
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

  // *expanded row
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
            {checkPaymentID[1] === "cash" ? `${checkPaymentID[1]} ${checkPaymentID[2]} ${String(checkPaymentID[4]).split("**")[1]}` : `${checkPaymentID[0]}_${checkPaymentID[1]}`}
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
                  {record.status === record.device ? "Returned" : "Active"}
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
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              width: "100%",
            }}
          >
            <button
              style={{
                ...DangerButton,
                background: "transparent",
                outline: "none",
                display: `${
                  checkPaymentID[1] === "cash" || checkPaymentID[1].length < 13
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
                    checkPaymentID[1].length < 13
                      ? "none"
                      : "flex"
                  }`,
                }}
              >
                Capture
              </p>
            </button>

            <button
              style={{
                ...DangerButton,
                background: "transparent",
                outline: "none",
                display: `${
                  checkPaymentID[1] === "cash" || checkPaymentID[1].length < 13
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
                    checkPaymentID[1].length < 13
                      ? "none"
                      : "flex"
                  }`,
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

  return (
    <Table
      columns={columns}
      expandable={{
        expandIcon: false,
        expandRowByClick: true,
        expandedRowRender: (record) => (
          <ExpandedRow
            rowRecord={record}
            refetching={refetchingAfterReturnDeviceInRow}
          />
        ),
      }}
      dataSource={finalDataToDisplayIncludeSearchFN()}
      className="table-ant-customized"
      pagination={{
        position: ["bottomCenter"],
      }}
      style={{ cursor: "pointer" }}
    />
  );
};

StripeTransactionPerConsumer.propTypes = {
  searchValue: PropTypes.string,
};
export default StripeTransactionPerConsumer;

// {/* <button
// style={
//   {
//     width: "fit-content",
//     outline: "none",
//     display: "flex",
//     padding: "16px 28px",
//     justifyContent: "center",
//     alignItems: "center",
//     gap: "12px",
//     flex: "1 0 0",
//     borderRadius: "8px",
//     border: "1px solid var(--Gray-300, #D0D5DD)",
//     background: "var(--Base-White, #FFF)",
//     /* Shadow/xs */
//     boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
//   }
// }
// >
// <ReleaseDepositIcon />
// <p
//   style={{
//     ...TextFontsize18LineHeight28,
//     color: "var(--Gray-700, #344054)",
//   }}
// >
//   Release deposit
// </p>
// </button> */}
