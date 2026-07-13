/* eslint-disable react-hooks/exhaustive-deps */
import { Icon } from "@iconify/react/dist/iconify.js";
import { useQuery } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Avatar, Spin, Tooltip } from "antd";
import { groupBy } from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import Chip from "../../../components/UX/Chip/Chip";
import BaseTable from "../../../components/UX/tables/BaseTable";
import Loading from "../../../components/animation/Loading";
import { onAddCustomerInfo } from "../../../store/slices/customerSlice";
import { onAddCustomer } from "../../../store/slices/stripeSlice";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import "../../../styles/global/ant-table.css";
import "./TablesConsumers.css";

export default function TablesConsumers({
  searching,
  data,
  getCounting,
  onResultCount,
}) {
  const { user } = useSelector((state) => state.admin);
  const { eventsPerAdmin } = useSelector((state) => state.event);
  const dataRef = useRef(null);
  const [responseData, setResponseData] = useState(data);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSortedAndFilterToRender, setDataSortedAndFilterToRender] =
    useState([]);
  const eventInfoCompanyQuery = useQuery({
    queryKey: ["AllEventsRelatedToCompanyInfo", user.companyData.id],
    queryFn: () => {
      return devitrakApi.post(`/event/event-list`, {
        company_id: user.companyData.id,
        type: "event",
      });
    },
    enabled: !!user.companyData.id,
  });

  const receiversQuery = useQuery({
    queryKey: ["AssignedReceiversByCompany", user.companyData.id],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-assigned-users-list", {
        company: user.companyData.id,
      }),
    enabled: !!user.companyData.id,
  });

  const receiversByEmail = useMemo(() => {
    const list = receiversQuery.data?.data?.listOfReceivers ?? [];
    return groupBy(list, "user");
  }, [receiversQuery.data]);
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
    navigate(`/consumers/${record.entireData.id ?? record.entireData._id}`);
  };
  useEffect(() => {
    dataRef.current =
      typeof data?.result?.usersList === "string"
        ? JSON.parse(data?.result?.usersList)
        : data?.result?.usersList;
    setResponseData(dataRef.current);
  }, [getCounting]);

  const getInfoNeededToBeRenderedInTable = useCallback(() => {
    const result = [];
    if (Array.isArray(responseData)) {
      for (let data of responseData) {
        result.push({
          company: user.company,
          user: [data.name, data.lastName],
          email: data.email,
          key: data.id ?? data._id,
          entireData: data,
        });
      }
    }
    return result.reverse();
  }, [responseData, user.company]);

  const dataToRenderInTable = async () => {
    const result = new Set();
    for (let data of getInfoNeededToBeRenderedInTable()) {
      const userTransactions = receiversByEmail[data.email] ?? [];
      const activeDeviceCount = userTransactions.filter(
        (t) => t.device?.status === true,
      ).length;
      result.add({
        ...data,
        currentActivity: activeDeviceCount,
        transactions: userTransactions,
      });
    }
    setIsLoading(false);
    return setDataSortedAndFilterToRender(Array.from(result));
  };

  useEffect(() => {
    dataToRenderInTable();
  }, [dataRef.current, receiversByEmail]);

  const filteredData = useMemo(() => {
    const term = searching?.trim().toLowerCase();
    if (!term) return dataSortedAndFilterToRender;

    return dataSortedAndFilterToRender.filter((item) => {
      const consumer = item.entireData ?? {};
      const haystack = [
        consumer.name,
        consumer.lastName,
        consumer.email,
        consumer.phoneNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [dataSortedAndFilterToRender, searching]);

  useEffect(() => {
    if (typeof onResultCount === "function") {
      onResultCount(filteredData.length);
    }
  }, [filteredData.length, onResultCount]);

  const renderingStyle = {
    ...TextFontsize18LineHeight28,
    fontSize: "14px",
    lineHeight: "20px",
    color: "var(--Gray-600, #475467)",
    alignSelf: "stretch",
    fontWeight: 500,
  };

  const renderingRowStyling = (props) => {
    return <p style={renderingStyle}>{props}</p>;
  };
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)",
  );

  const renderingEventsPermittedForAdminBasedOnAdminAssignment = (record) => {
    if (!eventInfoCompanyQuery?.data?.data?.list) return [];

    const eventCompanyData = groupBy(
      eventInfoCompanyQuery?.data?.data?.list,
      "id",
    );

    const active = eventsPerAdmin?.active?.map((item) => item.id) ?? [];
    const completed = eventsPerAdmin?.completed?.map((item) => item.id) ?? [];
    const adminPermitted = [...active, ...completed];

    const checked = new Map();

    for (let eventId of record.event_providers ?? []) {
      const eventEntry = eventCompanyData[eventId];
      if (!eventEntry) continue;

      // Si el admin tiene eventos asignados, filtrar por sus permisos.
      // Si no tiene ninguno cargado (ej. navegación directa a /consumers),
      // mostrar todos los eventos del consumer.
      if (adminPermitted.length === 0 || adminPermitted.includes(eventId)) {
        checked.set(eventId, eventEntry[0]);
      }
    }

    return Array.from(checked.values());
  };

  const eventFilterOptions = useMemo(() => {
    const list = eventInfoCompanyQuery?.data?.data?.list ?? [];
    const seen = new Map();
    for (const ev of list) {
      const name = ev.eventInfoDetail?.eventName ?? "";
      if (name && !seen.has(ev.id)) seen.set(ev.id, name);
    }
    return Array.from(seen, ([value, text]) => ({ text, value }));
  }, [eventInfoCompanyQuery?.data]);

  const columns = [
    {
      title: renderingRowStyling("User"),
      dataIndex: "user",
      width: "fit-content",
      responsive: ["xs", "sm", "md", "lg"],
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
          <Avatar
            src={record.entireData.profile_picture ?? ""}
            style={{
              display: isSmallDevice || isMediumDevice ? "none" : "flex",
            }}
          />
          {user?.map((detail, index) => {
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
      dataIndex: "entireData",
      responsive: ["md", "lg"],
      width: "13%",
      filters: [
        { text: "Active", value: "active" },
        { text: "Inactive", value: "inactive" },
      ],
      onFilter: (value, record) =>
        value === "active"
          ? record.currentActivity > 0
          : record.currentActivity < 1,
      sorter: {
        compare: (a, b) => (a.currentActivity > 0 ? 1 : 0) - (b.currentActivity > 0 ? 1 : 0),
      },
      render: (_, record) => {
        const isActive = record.currentActivity > 0;
        return (
          <Chip
            label={isActive ? "Active" : "Inactive"}
            color={isActive ? "success" : "info"}
            icon={
              <Icon
                icon="tabler:point-filled"
                rotate={3}
                color={isActive ? "#12B76A" : "#2E90FA"}
              />
            }
          />
        );
      },
    },
    {
      title: (
        <div style={{ width: "fit-content" }}>
          {renderingRowStyling("Email")}
        </div>
      ),
      dataIndex: "email",
      width: "fit-content",
      responsive: ["xs", "sm", "md", "lg"],
      sorter: {
        compare: (a, b) => ("" + a.email).localeCompare(b.email),
      },
      render: (email) => <p style={renderingStyle}>{email}</p>,
    },
    {
      title: renderingRowStyling("Devices"),
      dataIndex: "currentActivity",
      responsive: ["lg"],
      sorter: {
        compare: (a, b) => a.currentActivity - b.currentActivity,
      },
      width: "7%",
      render: (currentActivity) => (
        <p style={{ ...renderingStyle, width: "fit-content" }}>
          {currentActivity}
        </p>
      ),
    },

    {
      title: renderingRowStyling("Events"),
      dataIndex: "entireData",
      width: "fit-content",
      responsive: ["md", "lg"],
      filters: eventFilterOptions,
      filterSearch: true,
      onFilter: (value, record) =>
        (record.entireData?.event_providers ?? []).includes(value),
      render: (entireData) => {
        const data =
          renderingEventsPermittedForAdminBasedOnAdminAssignment(entireData) ??
          [];

        if (data.length === 0) {
          return (
            <Chip
              color="primary"
              variant="filled"
              label="No event assigned"
            />
          );
        }

        const MAX_VISIBLE = 4;
        const visible = data.slice(0, MAX_VISIBLE);
        const overflow = data.length - MAX_VISIBLE;

        const getInitials = (name = "") =>
          name
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase() ?? "")
            .join("");

        return (
          <div className="event-badge-group">
            {visible.map((event, idx) => {
              const eventName = event.eventInfoDetail?.eventName ?? "";
              return (
                <Tooltip key={event.id ?? idx} title={eventName}>
                  <Avatar className="event-badge-avatar">
                    {getInitials(eventName)}
                  </Avatar>
                </Tooltip>
              );
            })}
            {overflow > 0 && (
              <Tooltip title={`+${overflow} more event${overflow > 1 ? "s" : ""}`}>
                <Avatar className="event-badge-overflow">+{overflow}</Avatar>
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      {!isLoading ? (
        <BaseTable
          sticky
          size="large"
          columns={columns}
          dataSource={filteredData}
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
          locale={{
            emptyText: searching?.trim()
              ? `No consumers match "${searching.trim()}"`
              : "No consumers",
          }}
          className="table-ant-customized"
        />
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "48px 0",
          }}
        >
          <Spin spinning={isLoading} indicator={<Loading />} percent={0} />
        </div>
      )}
    </>
  );
}