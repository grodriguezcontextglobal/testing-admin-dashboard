/* eslint-disable react-hooks/exhaustive-deps */
import { Chip } from "@mui/material";
import { Avatar, Spin, Table } from "antd";
import { groupBy } from "lodash";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { onAddCustomerInfo } from "../../../store/slices/customerSlice";
import { onAddCustomer } from "../../../store/slices/stripeSlice";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Subtitle } from "../../../styles/global/Subtitle";
import "../../../styles/global/ant-table.css";

export default function TablesConsumers({
  searching,
  getCounting,
  getActiveAndInactiveCount,
}) {
  const { user } = useSelector((state) => state.admin);
  const { eventsPerAdmin } = useSelector((state) => state.event);
  const [responseData, setResponseData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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
      devitrakApi.get(
        `/event/event-list-per-company?company=${user.companyData.company_name}&type=event`
      ),
    refetchOnMount: false,
  });
  // const leaseInfo = useQuery({
  //   queryKey: ["allLeaseInfoPerCompanyList"],
  //   queryFn: () =>
  //     devitrakApi.get(
  //       `/event/event-list-per-company?company=${user.companyData.company_name}&type=lease`
  //     ),
  //   refetchOnMount: false,
  // });

  const listOfEventsPerAdmin = () => {
    const active = eventsPerAdmin.active ?? [];
    const completed = eventsPerAdmin.completed ?? [];
    let events = [...active, ...completed];
    const result = new Map();
    for (let data of events) {
      if (!result.has(data.id)) {
        result.set(data.id, data);
      }
    }
    return result;
  };

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    listOfEventsPerAdmin();
    return () => {
      controller.abort();
    };
  }, []);

  const consumersPerAllowEvents = async () => {
    // setLoadingState(true);
    const finalReturn = new Map();
    if (listOfEventsPerAdmin().size > 0) {
      const data = [
        ...listOfEventsPerAdmin()
          .keys()
          .map((item) => item),
      ];
      const fetchUsersAttendees = await devitrakApi.post("/auth/user-query", {
        event_providers: { $in: data },
        company_providers: user.companyData.id,
      });
      if (fetchUsersAttendees.data.ok) {
        const responseData = fetchUsersAttendees.data.users;
        for (let data of responseData) {
          if (!finalReturn.has(data.id)) {
            finalReturn.set(data.id, data);
          }
        }
      }
    }
    const formattingResponse = [...finalReturn.values().map((item) => item)];
    getCounting(formattingResponse.length);
    return setResponseData(formattingResponse);
  };

  useEffect(() => {
    const controller = new AbortController();
    consumersPerAllowEvents();
    eventsInfo.refetch();

    return () => {
      controller.abort();
    };
  }, []);

  const checkEventsPerCompany = () => {
    if (searching?.length > 0) {
      const check = responseData?.filter((item) =>
        JSON.stringify(item)
          .toLowerCase()
          .includes(String(searching).toLowerCase())
      );
      return check;
    }
    return responseData;
  };
  checkEventsPerCompany();

  const getInfoNeededToBeRenderedInTable = () => {
    let result = new Set();
    let mapTemplate = {};
    for (let data of checkEventsPerCompany()) {
      mapTemplate = {
        company: user.company,
        user: [data.name, data.lastName],
        email: data.email,
        key: data.id,
        entireData: data,
      };
      result.add(mapTemplate);
    }
    return Array.from(result).reverse();
  };

  const sortEventsDataPerCompany = () => {
    const events = new Map();
    if (eventsInfo.data) {
      const info = [...eventsInfo.data.data.list];
      for (let data of info) {
        events.set(data.id, data);
      }
    }
    return events;
  };

  const currentStatus = (props) => {
    const grouping = groupBy(props, "device.status");
    return grouping[true] ? grouping[true].length > 0 : false;
  };
  const checkingActiveEventForActiveConsumer = (props) => {
    let result = false;
    for (let [key, value] of sortEventsDataPerCompany()) {
      if (props.some((element) => element === key)) {
        if (value.active) return (result = value.active);
      }
    }
    return result;
  };

  const renderingTransactionsPerEventPerConsumer = async () => {
    const fetching = await devitrakApi.post(
      "/receiver/receiver-assigned-list",
      {
        user: {
          $in: [
            ...getInfoNeededToBeRenderedInTable().map((item) => item.email),
          ],
        },
        company: user.companyData.id,
      }
    );
    if (fetching.data.ok) {
      const groupingbyUser = groupBy(fetching.data.listOfReceivers, "user");
      return groupingbyUser;
    }
    return [];
  };
  const dataToRenderInTable = async () => {
    const result = new Set();
    const existingData = await renderingTransactionsPerEventPerConsumer();
    for (let data of getInfoNeededToBeRenderedInTable()) {
      const currentActiveStatus = await checkingActiveEventForActiveConsumer(
        data.entireData.event_providers
      );
      result.add({
        ...data,
        currentActivity: existingData[data.email] ?? [],
        status: currentStatus(existingData[data.email]) ?? [],
        currentConsumerActive: currentActiveStatus,
      });
      await getActiveAndInactiveCount(Array.from(result));
    }
    setIsLoading(false);
    return setDataSortedAndFilterToRender(Array.from(result));
  };

  const timerTrigger = setTimeout(() => {
    dataToRenderInTable();
  }, 1500);

  useEffect(() => {
    const controller = new AbortController();
    dataToRenderInTable();
    return () => {
      controller.abort();
      clearTimeout(timerTrigger);
    };
  }, [
    Array.isArray(getInfoNeededToBeRenderedInTable()),
    getInfoNeededToBeRenderedInTable()?.length,
    timerTrigger
  ]);

  clearTimeout(timerTrigger);

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
      render: (user, record) => (
        <span
          key={`${user}`}
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignSelf: "flex-start",
            gap: "5px",
          }}
        >
          <Avatar src={record.entireData.profile_picture ?? ""} />
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
    <>
      {!isLoading ? (
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
      ) : (
        <Spin spinning={isLoading} percent={0} fullscreen />
      )}
    </>
  );
}
