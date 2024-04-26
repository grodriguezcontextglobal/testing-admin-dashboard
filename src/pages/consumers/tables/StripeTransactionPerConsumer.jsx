import { Icon } from "@iconify/react";
import { Typography } from "@mui/material";
import { Badge, Table } from "antd";
import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import '../../../styles/global/ant-table.css'
import { devitrakApi } from "../../../api/devitrakApi";
import { onAddEventData, onSelectCompany, onSelectEvent } from "../../../store/slices/eventSlice";
import { onAddSubscription } from "../../../store/slices/subscriptionSlice";
import { onAddPaymentIntentSelected } from "../../../store/slices/stripeSlice";
const StripeTransactionPerConsumer = ({ searchValue }) => {
  const { user } = useSelector((state) => state.admin);
  const { eventsPerAdmin } = useSelector((state) => state.event)
  const { customer } = useSelector((state) => state.customer);
  const [responsedData, setResponsedData] = useState([])
  const navigate = useNavigate();
  const dispatch = useDispatch()

  //refactoring -->>
  const avoidDuplicatedEventsPerAdmin = () => {
    const result = new Set()
    if (eventsPerAdmin.active) {
      for (let data of eventsPerAdmin.active) {
        const toString = JSON.stringify(data)
        if (!result.has(toString)) {
          result.add(toString)
        }
      }
    }
    if (eventsPerAdmin.completed) {
      for (let data of eventsPerAdmin.completed) {
        const toString = JSON.stringify(data)
        if (!result.has(toString)) {
          result.add(toString)
        }
      }
    }
    return Array.from(result)
  }
  const fetchingDataPerAllowed = useCallback(async () => {
    const result = new Map();
    if (avoidDuplicatedEventsPerAdmin().length > 0) {
      for (let data of avoidDuplicatedEventsPerAdmin()) {
        const parsing = JSON.parse(data)
        if (customer.data.eventSelected.some(element => element === parsing.eventInfoDetail.eventName) && customer.data.provider.some(element => element === parsing.company)) {
          const respo = await devitrakApi.post("/receiver/receiver-assigned-list", { provider: parsing.company, user: customer.email, eventSelected: parsing.eventInfoDetail.eventName })
          if (respo.data) {
            if (respo.data.listOfReceivers.length > 0) {
              for (let data of respo.data.listOfReceivers) {
                if (!result.has(data.paymentIntent)) {
                  result.set(data.paymentIntent, [data])
                } else {
                  result.set(data.paymentIntent, [...result.get(data.paymentIntent), data])
                }
              }
            }
          }
        }
      }
    }
    return setResponsedData(result)
  }, [])
  fetchingDataPerAllowed()

  const reformedSourceData = () => {
    const result = new Set()
    responsedData.forEach((value) => {
      result.add({
        eventSelected: value[0].eventSelected,
        paymentIntent: value[0].paymentIntent,
        device: value.length,
        status: value.reduce((acc, { device }) => acc + (device.status === false), 0),
      })
    })
    return Array.from(result)
  };

  const finalDataToDiplayIncludeSearchFN = () => {
    if (searchValue?.length > 0 && reformedSourceData()?.length > 0) {
      return reformedSourceData().filter(element =>
        String(element.eventSelected).toLowerCase().includes(String(searchValue).toLowerCase()) ||
        String(element.paymentIntent).toLowerCase().includes(String(searchValue).toLowerCase())
      )
    }
    return reformedSourceData()
  }
  // reformedSourceData()
  //<<-- end reform algorithms
  // if (stripeTransactionsSavedQuery.isLoading) return <p>Loading</p>;
  // if (stripeTransactionsSavedQuery.isError)
  //   return <p>Something went wrong, please refresh page.</p>;
  // if (stripeTransactionsSavedQuery.data) {
  //   const filterDataBasedOnUserAndEvent = () => {
  //     if (searchValue?.length < 1) {
  //       const check =
  //         stripeTransactionsSavedQuery.data.data.stripeTransactions?.filter(
  //           (transaction) =>
  //             transaction?.user?._id === user_url &&
  //             transaction.provider === user.company
  //         );

  //       return check;
  //     } else {
  //       const check =
  //         stripeTransactionsSavedQuery.data.data.stripeTransactions?.filter(
  //           (transaction) =>
  //             transaction.paymentIntent === searchValue &&
  //             transaction?.user?._id === user_url
  //         );
  //       return check;
  //     }
  //   };

  //   const foundTransactionAndDevicesAssigned = () => {
  //     let result = [];
  //     let index = 0;
  //     for (let data of filterDataBasedOnUserAndEvent()) {
  //       const check =
  //         deviceAssignedListQuery.find(
  //           (item) => item.paymentIntent === data.paymentIntent
  //         );
  //       // ?.data?.data?.listOfReceivers?

  //       if (check) {
  //         const newObject = {
  //           ...data,
  //           assignedDevices: check.device,
  //         };

  //         result.splice(index, 0, newObject);
  //         index++;
  //       } else {
  //         const newObject = {
  //           ...data,
  //           assignedDevices: [{ serialNumber: "", status: true }],
  //         };

  //         result.splice(index, 0, newObject);
  //         index++;
  //       }
  //     }
  //     return result;
  //   };

  //   const sourceData = () => {
  //     let result = [];
  //     let index = 0;
  //     const noDeleteItem = 0;
  //     let final = {};
  //     for (let data of foundTransactionAndDevicesAssigned()) {
  //       final = {
  //         ...data,
  //         key: data.id,
  //       };
  //       result.splice(index, noDeleteItem, final);
  //       index++;
  //       final = {};
  //     }
  //     return result;
  //   };

  const moreDetailFn = async (record) => {
    const eventListQuery = await devitrakApi.post("/event/event-list", { company: user.company, 'eventInfoDetail.eventName': record.eventSelected[0] })
    dispatch(onSelectEvent(eventListQuery.data.list[0].eventInfoDetail.eventName));
    dispatch(onSelectCompany(eventListQuery.data.list[0].company));
    dispatch(onAddEventData(eventListQuery.data.list[0]));
    dispatch(onAddSubscription(eventListQuery.data.list[0].subscription));
    dispatch(onAddPaymentIntentSelected(record.paymentIntent));
    navigate(`/events/event-attendees/${customer.uid ?? customer.id}/transactions-details`);
  };
  const columns = [
    {
      title: "Event",
      dataIndex: "eventSelected",
      key: "eventSelected",
    },
    {
      title: "Transaction ID",
      dataIndex: "paymentIntent",
      key: "paymentIntent",
    },
    {
      title: "Devices",
      dataIndex: "device",
      key: "device",
      responsive: ["lg"],
      render: (device) => (
        <Typography
          color={"var(--gray-600, #475467)"}
          fontFamily={"Inter"}
          fontSize={"14px"}
          fontStyle={"normal"}
          fontWeight={"400"}
          lineHeight={"20px"}
        >
          {device} {device > 1 ? "devices" : "device"}
        </Typography>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      responsive: ["lg"],
      render: (status) => (
        <Badge
          style={{
            display: "flex",
            padding: "2px 8px",
            alignItems: "center",
            borderRadius: "16px",
            background: "var(--success-50, #ECFDF3)",
            // `${status
            //   ? "var(--primary-50, #F9F5FF)"
            //   : "var(--success-50, #ECFDF3)"
            //   }`,
            mixBlendMode: "multiply",
          }}
        >
          <Typography
            color={
              // status
              //   ? "var(--primary-700, #6941C6)"
              "var(--success-700, #027A48)"
            }
            fontFamily={"Inter"}
            fontSize={"14px"}
            fontStyle={"normal"}
            fontWeight={"400"}
            lineHeight={"20px"}
          >
            {status} returned
          </Typography>
        </Badge>
      ),
    },
    {
      title: "More detail",
      dataIndex: "action",
      key: "action",
      responsive: ["md"],
      width: "15%",
      render: (_, record) => (
        <Icon
          onClick={() => moreDetailFn(record)}
          icon="material-symbols:more-up"
          width={25}
          height={25}
        />
      ),
    },
  ];
  return (
    <Table
      columns={columns}
      dataSource={finalDataToDiplayIncludeSearchFN()}
      className="table-ant-customized"
      pagination={{
        position: ["bottomCenter"],
      }}
    />
  );
};

export default StripeTransactionPerConsumer;
