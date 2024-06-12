import { Table } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { onAddCustomerInfo } from "../../../../../store/slices/customerSlice";
import { onAddCustomer } from "../../../../../store/slices/stripeSlice";
import "../../../../../styles/global/ant-table.css";
const TableDetailPerDevice = ({ searching }) => {
  const { deviceInfoSelected } = useSelector((state) => state.devicesHandle);
  const { event } = useSelector((state) => state.event);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [assignedDeviceList, setAssignedDeviceList] = useState([]);
  const assignedDeviceTracking = useCallback(async () => {
    const respo = await devitrakApi.post("/receiver/receiver-assigned-list", {
      "device.serialNumber": deviceInfoSelected.serialNumber,
      eventSelected: event.eventInfoDetail.eventName,
      provider: event.company,
    });
    if (respo.data.ok) {
      const result = [...assignedDeviceList, ...respo.data.listOfReceivers];
      setAssignedDeviceList(result);
    }
  }, []);

  const [defectedDevicesList, setDefectedDevicesList] = useState([]);
  const defecedDeviceTracking = useCallback(async () => {
    const respo = await devitrakApi.post(
      "/receiver/list-receiver-returned-issue",
      {
        "device.serialNumber": deviceInfoSelected.serialNumber,
        eventSelected: event.eventInfoDetail.eventName,
        provider: event.company,
      }
    );
    if (respo.data.ok) {
      const result = [...defectedDevicesList, ...respo.data.record];
      setDefectedDevicesList(result);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    assignedDeviceTracking();
    defecedDeviceTracking();
    return () => {
      controller.abort();
    };
  }, [assignedDeviceList.length, defectedDevicesList.length]);

  const sortingAssignedDeviceTrack = useCallback(() => {
    const addingKey = new Set();
    for (let data of assignedDeviceList) {
      addingKey.add({ key: data.id, ...data });
    }
    return Array.from(addingKey).reverse();
  }, [assignedDeviceList.length]);
  const finalResult = () => {
    if (!searching || String(searching).length < 1) {
      return [...sortingAssignedDeviceTrack(), ...defectedDevicesList];
    } else {
      const data = [...sortingAssignedDeviceTrack(), ...defectedDevicesList];
      return data.filter(
        (element) =>
          String(element.user)
            .toLowerCase()
            .includes(String(searching).toLowerCase()) ||
          String(element.eventSelected[0])
            .toLowerCase()
            .includes(String(searching).toLowerCase())
      );
    }
  };

  const handleConsumerNavigation = async (record) => {
    const consumerData = await devitrakApi.post("/auth/users", {
      email: record.user,
    });
    if (consumerData.data) {
      const consumer = consumerData.data.users.at(-1);
      let userFormatData = {
        uid: consumer.id ?? consumer.uid,
        name: consumer.name,
        lastName: consumer.lastName,
        email: consumer.email,
        phoneNumber: consumer.phoneNumber,
      };
      dispatch(onAddCustomerInfo(userFormatData));
      dispatch(onAddCustomer(userFormatData));
      await navigate(
        `/events/event-attendees/${userFormatData.uid}/transactions-details`
      );
    }
  };
  const renderRowStyle = {
    textTransform: "none",
    fontSize: "14px",
    fontFamily: "Inter",
    fontStyle: "normal",
    fontWeight: 400,
    lineHeight: "20px",
  };

  const displayTernary = (arg1, bg1, bg2, bg3) => {
    if (typeof arg1 === 'string') {
      return bg1;
    } else {
      if (arg1) {
        return bg2;
      }
      return bg3;
    }
  };

  const columns = [
    {
      title: "Event",
      dataIndex: "eventSelected",
      align: "left",
      sorter: {
        compare: (a, b) =>
          ("" + a.eventSelected).localeCompare(b.eventSelected),
      },
      render: (eventSelected) => (
        <button
          onClick={() => navigate("/events/event-quickglance")}
          style={{
            margin: "auto",
            cursor: "pointer",
            outline: "none",
            backgroundColor: "transparent",
          }}
        >
          <p
            style={{
              ...renderRowStyle,
              color: "var(--blue-dark-600, #155EEF)",
            }}
          >
            {eventSelected}
          </p>
        </button>
      ),
    },
    {
      title: "Status",
      dataIndex: "device.status",
      align: "left",
      responsive: ["md", "lg"],
      sorter: {
        compare: (a, b) => ("" + a.status).localeCompare(b.status),
      },
      render: (_, record) => (
        console.log("record", record),
        (
          <span
            style={{
              margin: "auto",
            }}
          >
            <p
              style={{
                ...renderRowStyle,
                backgroundColor: displayTernary(
                  record.device.status,
                  "var(--orange-dark-50, #FFF4ED)",
                  "var(--orange-dark-50, #FFF4ED)",
                  "var(--success-50, #ECFDF3)"
                ),
                width: "fit-content",
                padding: "5px 8px",
                borderRadius: "8px",
                color: displayTernary(
                  record.device.status,
                  "var(--orange-700, #B93815)",
                  "var(--orange-700, #B93815)",
                  "var(--success-700, #027A48)"
                ),
              }}
            >
              {displayTernary(
                record.device.status,
                record.device.status,
                "In-use",
                "Returned"
              )}
            </p>
          </span>
        )
      ),
    },
    {
      title: "Condition",
      dataIndex: "status",
      align: "left",
      responsive: ["md", "lg"],
      sorter: {
        compare: (a, b) => ("" + a.status).localeCompare(b.status),
      },
      render: (status) => (
        <span style={{ margin: "auto" }}>
          <p style={renderRowStyle}>
            {typeof status === "string" ? status : "Operational"}
          </p>
        </span>
      ),
    },
    {
      title: "Consumer",
      dataIndex: "user",
      width: "33%",
      align: "left",
      sorter: {
        compare: (a, b) => ("" + a.user).localeCompare(b.user),
      },
      render: (_, record) => (
        <button
          onClick={() => handleConsumerNavigation(record)}
          style={{
            margin: 0,
            padding: 0,
            cursor: "pointer",
            backgroundColor: "transparent",
            outline: "none",
          }}
        >
          <p
            style={{
              ...renderRowStyle,
              color: "var(--blue-dark-600, #155EEF)",
            }}
          >
            {record.user}
          </p>
        </button>
      ),
    },
  ];

  return (
    <Table
      sticky
      size="large"
      columns={columns}
      dataSource={finalResult()}
      pagination={{
        position: ["bottomCenter"],
      }}
      className="table-ant-customized"
    />
  );
};

export default TableDetailPerDevice;
