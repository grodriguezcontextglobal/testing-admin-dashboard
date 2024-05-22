import { Chip } from "@mui/material";
import { Avatar, Badge, Table } from "antd";
import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { RightNarrowInCircle } from "../../../components/icons/Icons";
import { onAddEventData, onSelectCompany, onSelectEvent } from "../../../store/slices/eventSlice";
import { onAddPaymentIntentSelected } from "../../../store/slices/stripeSlice";
import { onAddSubscription } from "../../../store/slices/subscriptionSlice";
import { Subtitle } from "../../../styles/global/Subtitle";
import '../../../styles/global/ant-table.css';
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
        // key: nanoid(Number(String(value[0].paymentIntent).length)),
        eventSelected: value[0].eventSelected,
        paymentIntent: value[0].paymentIntent,
        device: value.length,
        status: value.reduce((acc, { device }) => acc + (device.status === false), 0),
      })
    })
    return Array.from(result)
  };

  const addingKeysToExpandRow = () => {
    const result = new Set()
    for (let data of reformedSourceData()) {
      result.add({
        // key: nanoid(String(data.paymentIntent).length),
        ...data
      })
    }
    return Array.from(result)
  };


  const finalDataToDiplayIncludeSearchFN = () => {
    if (searchValue?.length > 0 && addingKeysToExpandRow()?.length > 0) {
      return addingKeysToExpandRow().filter(element =>
        String(element.eventSelected).toLowerCase().includes(String(searchValue).toLowerCase()) ||
        String(element.paymentIntent).toLowerCase().includes(String(searchValue).toLowerCase())
      )
    }
    return addingKeysToExpandRow()
  }
  const moreDetailFn = async (record) => {
    const eventListQuery = await devitrakApi.post("/event/event-list", { company: user.company, 'eventInfoDetail.eventName': record.eventSelected[0] })
    dispatch(onSelectEvent(eventListQuery.data.list[0].eventInfoDetail.eventName));
    dispatch(onSelectCompany(eventListQuery.data.list[0].company));
    dispatch(onAddEventData(eventListQuery.data.list[0]));
    dispatch(onAddSubscription(eventListQuery.data.list[0].subscription));
    dispatch(onAddPaymentIntentSelected(record.paymentIntent));
    navigate(`/events/event-attendees/${customer.uid ?? customer.id}/transactions-details`);
  };

  //*expanded row
  // const expandedRowRender = (rowRecord) => {
  //   const columns = [
  //     {
  //       title: 'Date',
  //       dataIndex: 'date',
  //       key: 'date',
  //     },
  //     {
  //       title: 'Name',
  //       dataIndex: 'name',
  //       key: 'name',
  //     },
  //     {
  //       title: 'Status',
  //       key: 'state',
  //       render: () => <Badge status="success" text="Finished" />,
  //     },
  //     {
  //       title: 'Upgrade Status',
  //       dataIndex: 'upgradeNum',
  //       key: 'upgradeNum',
  //     },
  //     {
  //       title: 'Action',
  //       key: 'operation',
  //       render: () => (
  //         <Space size="middle">
  //           <a>Pause</a>
  //           <a>Stop</a>

  //         </Space>
  //       ),
  //     },
  //   ];
  //   const dataExpanded = [];
  //   for (let i = 0; i < 3; ++i) {
  //     dataExpanded.push({
  //       key: i.toString(),
  //       date: '2014-12-24 23:12:00',
  //       name: 'This is production name',
  //       upgradeNum: 'Upgraded: 56',
  //     });
  //   }
  //   return <Table columns={columns} dataSource={dataExpanded} pagination={false} />;
  // };
  const columns = [
    {
      title: "Event",
      dataIndex: "eventSelected",
      key: "eventSelected",
      render: (eventSelected) => {
        const initials = String(eventSelected).split(" ")
        return (
          <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}><Avatar>{initials.map(item => item[0])}</Avatar>&nbsp;
            <p style={{
              color: "var(--Blue-dark-600, #155EEF)",
              fontFamily: "Inter",
              fontSize: "14px",
              fontStyle: "normal",
              fontWeight: "400",
              lineHeight: "20px", /* 142.857% */
            }}>{eventSelected}</p ></div>
        )
      }
    },
    {
      title: "Transaction ID",
      dataIndex: "paymentIntent",
      key: "paymentIntent",
      render: (paymentIntent) => (
        <p style={{
          color: "var(--Gray900)", //, #101828
          fontFamily: "Inter",
          fontSize: "14px",
          fontStyle: "normal",
          fontWeight: "400",
          lineHeight: "20px", /* 142.857% */
        }}> {paymentIntent}</p >
      )
    },
    {
      title: "Devices",
      dataIndex: "device",
      key: "device",
      responsive: ["lg"],
      render: (_, record) => (
        <p
          style={Subtitle}        >
          {record.device} {record.device > 1 ? "devices" : "device"}&nbsp;
          <Badge
            style={{
              display: "flex",
              padding: "2px 8px",
              alignItems: "center",
              borderRadius: "16px",
              background: "var(--success-50, #ECFDF3)",
              mixBlendMode: "multiply",
            }}
          ><Chip style={{ backgroundColor: `${record.status === record.device ? "var(--Success-50, #ECFDF3)" : "var(--Primary-50, #F9F5FF)"}` }} label={<p
            style={{
              color: `${record.status === record.device ? "var(--success-700, #027A48)" : "var(--Primary-700, #6941C6)"}`,
              fontFamily: "Inter",
              fontSize: "12px",
              fontStyle: "normal",
              fontWeight: 500,
              lineHeight: "18px",
            }}
          >
            {record.status === record.device ? "Returned" : "Active"}
          </p>
          } />
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
      render: (_, record) => (
        <button style={{ background: "transparent", outline: "none" }} onClick={() => moreDetailFn(record)}>
          <RightNarrowInCircle />
        </button>
      ),
    },
  ];
  return (
    <Table
      columns={columns}
      // expandable={{
      //   expandedRowRender: (record) => (
      //     expandedRowRender(record))
      // }}
      dataSource={finalDataToDiplayIncludeSearchFN()}
      className="table-ant-customized"
      pagination={{
        position: ["bottomCenter"],
      }}
    />
  );
};

export default StripeTransactionPerConsumer;
