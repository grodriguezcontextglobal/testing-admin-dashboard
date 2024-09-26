/* eslint-disable react-hooks/exhaustive-deps */
import { Chip } from "@mui/material";
import { Avatar, Table } from "antd";
import { groupBy } from "lodash";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { onAddCustomerInfo } from "../../../store/slices/customerSlice";
import { onAddCustomer } from "../../../store/slices/stripeSlice";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import "../../../styles/global/ant-table.css";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Subtitle } from "../../../styles/global/Subtitle";

export default function TablesConsumers({
  getInfoNeededToBeRenderedInTable,
  getActiveAndInactiveCount,
}) {
  const { user } = useSelector((state) => state.admin);
  const [dataSortedAndFilterToRender, setDataSortedAndFilterToRender] =
    useState([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const handleDataDetailUser = (record) => {
    let userFormatData = {
      uid: record?.key,
      name: record?.entireData?.name,
      lastName: record?.entireData?.lastName,
      email: record?.entireData?.email,
      phoneNumber: record?.entireData?.phoneNumber,
      data: record.entireData,
    };
    dispatch(onAddCustomerInfo(userFormatData));
    dispatch(onAddCustomer(userFormatData));
    navigate(`/consumers/${record.entireData.id}`);
  };

  const eventsInfo = useQuery({
    queryKey: ["allEventsInfoPerCompanyList"],
    queryFn: () =>
      devitrakApi.post("/event/event-list", {
        company: user.company,
      }),
    refetchOnMount: false,
  });

  const sortEventsDataPerCompany = () => {
    const events = new Map();
    if (eventsInfo.data) {
      const info = [...eventsInfo.data.data.list];
      for (let data of info) {
        events.set(data.eventInfoDetail.eventName, data);
      }
    }
    return events;
  };
  const currentStatus = (props) => {
    const grouping = groupBy(props, "device.status");
    if (grouping[true]) return true;
    return false;
  };
  const checkingActiveEventForActiveConsumer = (props) => {
    const result = [false];
    for (let [key, value] of sortEventsDataPerCompany()) {
      if (props.some((element) => element === key)) {
        if (value.active) return (result[0] = value.active);
      }
    }
    return result[0];
  };
  const dataToRenderInTable = async () => {
    const result = new Set();
    for (let data of getInfoNeededToBeRenderedInTable) {
      const currentActiveStatus = await checkingActiveEventForActiveConsumer(
        data.entireData.eventSelected
      );
      const fetching = await devitrakApi.post(
        "/receiver/receiver-assigned-users-list",
        {
          user: data.email,
          company: user.companyData.id,
        }
      );
      if (fetching.data.ok) {
        result.add({
          ...data,
          currentActivity: fetching.data.listOfReceivers,
          status: currentStatus(fetching.data.listOfReceivers),
          currentConsumerActive: currentActiveStatus,
        });
      }
      await getActiveAndInactiveCount(Array.from(result));
    }
    // await getActiveAndInactiveCount(Array.from(result));
    return setDataSortedAndFilterToRender(Array.from(result));
  };

  useEffect(() => {
    const controller = new AbortController();
    dataToRenderInTable();
    eventsInfo.refetch();
    return () => {
      controller.abort();
    };
  }, [
    Array.isArray(getInfoNeededToBeRenderedInTable),
    getInfoNeededToBeRenderedInTable?.length,
  ]);

  const renderingStyle = {
    ...TextFontsize18LineHeight28,
    fontSize: "14px",
    lineHeight: "20px",
    color: "var(--Gray-600, #475467)",
    alignSelf: "stretch",
    fontWeight: 500,
  };
  const renderingRowStyle = {
    ...TextFontsize18LineHeight28,
    fontSize: "12px",
    lineHeight: "18px",
    color: "var(--Indigo-700, #3538CD)",
    alignSelf: "stretch",
    fontWeight: 400,
  };

  const renderingStyleInChip = (props) => {
    return <p style={renderingRowStyle}>{props}</p>;
  };

  const renderingRowStyling = (props) => {
    return <p style={renderingStyle}>{props}</p>;
  };

  const cellStyle = {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
  };

  const columns = [
    {
      title: renderingRowStyling("User"),
      dataIndex: "user",
      width: "fit-content",
      sorter: {
        compare: (a, b) => ("" + a.user).localeCompare(b.user),
      },
      render: (user) => (
        <span
          key={`${user}`}
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignSelf: "flex-start",
            gap: "5px",
          }}
        >
          <Avatar />
          {user.map((detail, index) => {
            return (
              <div
                key={`${detail}-${index}`}
                style={{
                  flexDirection: "column",
                  color: "var(--gray-600, #475467)",
                  fontSize: "14px",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                  fontWeight: 500,
                }}
              >
                <p style={{ ...renderingStyle, textTransform: "capitalize" }}>
                  {detail}
                </p>
              </div>
            );
          })}
        </span>
      ),
    },
    {
      title: (
        <div style={{ width: "fit-content" }}>
          {renderingRowStyling("Status")}
        </div>
      ),
      dataIndex: "currentConsumerActive",
      width: "13%",
      sorter: {
        compare: (a, b) =>
          ("" + a.currentConsumerActive).localeCompare(b.currentConsumerActive),
      },
      render: (currentConsumerActive) => (
        <span
          style={{
            ...cellStyle,
            borderRadius: "16px",
            justifyContent: "center",
            display: "flex",
            padding: "2px 8px",
            alignItems: "center",
            background: `${
              !currentConsumerActive
                ? "var(--blue-50, #EFF8FF)"
                : "var(--success-50, #ECFDF3)"
            }`,
            width: "fit-content",
          }}
        >
          <p
            style={{
              ...Subtitle,
              color: `${
                !currentConsumerActive
                  ? "var(--blue-700, #175CD3)"
                  : "var(--success-700, #027A48)"
              }`,
              textTransform: "capitalize",
            }}
          >
            <Icon
              icon="tabler:point-filled"
              rotate={3}
              color={`${!currentConsumerActive ? "#2E90FA" : "#12B76A"}`}
            />
            {!currentConsumerActive ? "No active" : "Active"}
          </p>
        </span>
      ),
    },

    {
      title: (
        <div style={{ width: "fit-content" }}>
          {renderingRowStyling("Email")}
        </div>
      ),
      dataIndex: "email",
      width: "fit-content",
      sorter: {
        compare: (a, b) => ("" + a.email).localeCompare(b.email),
      },
      render: (email) => <p style={renderingStyle}>{email}</p>,
    },
    {
      title: renderingRowStyling("Devices"),
      dataIndex: "currentActivity",
      sorter: {
        compare: (a, b) =>
          ("" + a.currentActivity).localeCompare(b.currentActivity),
      },
      width: "7%",
      render: (currentActivity) => (
        <p style={{ ...renderingStyle, width: "fit-content" }}>
          {currentActivity?.length}
        </p>
      ),
    },

    {
      title: renderingRowStyling("Events"),
      dataIndex: "entireData",
      width: "fit-content",
      render: (entireData) => (
        <>
          <Chip
            style={{ background: "var(--Indigo-50, #EEF4FF)" }}
            label={renderingStyleInChip(entireData?.eventSelected?.at(-1))}
          />
          &nbsp;
          {entireData.eventSelected?.length > 1 && (
            <Chip
              label={renderingRowStyling(
                `+${Number(entireData.eventSelected?.length) - 1}`
              )}
            />
          )}
        </>
      ),
    },
  ];
  return (
    <Table
      sticky
      size="large"
      columns={columns}
      dataSource={dataSortedAndFilterToRender}
      onRow={(record) => {
        return {
          onClick: () => {
            handleDataDetailUser(record);
          },
        };
      }}
      style={{ cursor: "pointer" }}
      pagination={{
        position: ["bottomCenter"],
      }}
      className="table-ant-customized"
    />
  );
}
