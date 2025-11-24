/* eslint-disable react-hooks/exhaustive-deps */
import { Icon } from "@iconify/react/dist/iconify.js";
import { Chip } from "@mui/material";
import { Avatar, Spin, Table } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Loading from "../../../components/animation/Loading";
import { onAddCustomerInfo } from "../../../store/slices/customerSlice";
import { onAddCustomer } from "../../../store/slices/stripeSlice";
import { Subtitle } from "../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import "../../../styles/global/ant-table.css";
import { useMediaQuery } from "@uidotdev/usehooks";
import { useQuery } from "@tanstack/react-query";
import { devitrakApi } from "../../../api/devitrakApi";
import { groupBy } from "lodash";

export default function TablesConsumers({ searching, data, getCounting }) {
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

  useEffect(() => {
    if (eventInfoCompanyQuery.data) {
      // console.log("Company events:", eventInfoCompanyQuery.data.data);
    }
    if (eventInfoCompanyQuery.error) {
      // console.error("Error fetching company events:", eventInfoCompanyQuery.error);
    }
  }, [eventInfoCompanyQuery.data, eventInfoCompanyQuery.error]);

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

  const getInfoNeededToBeRenderedInTable = useCallback(() => {
    let result = new Set();
    let mapTemplate = {};
    if (checkEventsPerCompany()?.length > 0) {
      for (let data of checkEventsPerCompany()) {
        mapTemplate = {
          company: user.company,
          user: [data.name, data.lastName],
          email: data.email,
          key: data.id ?? data._id,
          entireData: data,
        };
        result.add(mapTemplate);
      }
    }
    return Array.from(result).reverse();
  }, [responseData?.length, dataRef.current]);

  const dataToRenderInTable = async () => {
    const result = new Set();
    for (let data of getInfoNeededToBeRenderedInTable()) {
      result.add({
        ...data,
        currentActivity: data.entireData.totalDeviceRequested,
        status: data.entireData.totalEventsActive,
        currentConsumerActive: data.entireData.totalEventsActive,
      });
    }
    setIsLoading(false);
    return setDataSortedAndFilterToRender(Array.from(result));
  };

  useEffect(() => {
    dataToRenderInTable();
  }, [dataRef.current]);

  const filterData = (data) => {
    if (!searching || searching.length < 1) return data;

    return data.filter((item) => {
      const searchLower = searching.toLowerCase();
      const fullDetailItem = JSON.stringify(item);

      return fullDetailItem.toLowerCase().includes(searchLower);
    });
  };

  const filteredData = filterData(dataSortedAndFilterToRender);

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
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );

  const renderingEventsPermittedForAdminBasedOnAdminAssignment = (record) => {
    const active = eventsPerAdmin?.active.map((item) => item.id) ?? [];
    const completed = eventsPerAdmin?.completed.map((item) => item.id) ?? [];
    const adminPermitted = [...active, ...completed];
    if (!eventInfoCompanyQuery?.data?.data?.list) return [];
    const eventCompanyData = groupBy(
      eventInfoCompanyQuery?.data?.data?.list,
      "id"
    );
    const checked = new Map();
    if (adminPermitted?.length > 0) {
      for (let event of record.event_providers) {
        if (adminPermitted.includes(event)) {
          checked.set(event, ...eventCompanyData[event]);
        }
      }
    }
    return Array.from(checked.values()).flat();
  };
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
      responsive: ["md", "lg"],
      width: "13%",
      sorter: {
        compare: (a, b) => a.currentConsumerActive - b.currentConsumerActive,
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
              currentConsumerActive === 0
                ? // !currentConsumerActive
                  "var(--blue-50, #EFF8FF)"
                : "var(--success-50, #ECFDF3)"
            }`,
            width: "fit-content",
          }}
        >
          <p
            style={{
              ...Subtitle,
              color: `${
                currentConsumerActive === 0
                  ? // !currentConsumerActive
                    "var(--blue-700, #175CD3)"
                  : "var(--success-700, #027A48)"
              }`,
              textTransform: "capitalize",
            }}
          >
            <Icon
              icon="tabler:point-filled"
              rotate={3}
              color={`${currentConsumerActive === 0 ? "#2E90FA" : "#12B76A"}`} //!currentConsumerActive ? "#2E90FA" : "#12B76A"}`}
            />
            {currentConsumerActive === 0 ? "Inactive" : "Active"}
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
      render: (entireData) => {
        const data =
          renderingEventsPermittedForAdminBasedOnAdminAssignment(entireData) ??
          [];
        return (
          <>
            {data.length > 0 ? (
              <>
                {" "}
                <Chip
                  style={{
                    background: "var(--Indigo-50, #EEF4FF)",
                    position: "relative",
                    zIndex: 2, // ensure this chip overlays the next
                    border: "1px solid var(--Indigo-700, #004EEB)",
                  }}
                  label={renderingStyleInChip(
                    data?.at(-1)?.eventInfoDetail?.eventName
                  )}
                />
                {data?.length > 1 && (
                  <Chip
                    label={renderingRowStyling(`+${Number(data?.length) - 1}`)}
                    style={{
                      marginLeft: -13, // pull under the first chip
                      position: "relative",
                      zIndex: 1, // sits behind the first chip
                    }}
                  />
                )}
              </>
            ) : (
              <Chip
                style={{
                  background: "var(--Indigo-50, #EEF4FF)",
                  position: "relative",
                  zIndex: 2, // ensure this chip overlays the next
                  border: "1px solid var(--Indigo-700, #004EEB)",
                }}
                label={renderingStyleInChip("No event assigned")}
              />
            )}
          </>
        );
      },
    },
  ];

  return (
    <>
      {!isLoading ? (
        <Table
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
          className="table-ant-customized"
        />
      ) : (
        <Spin
          spinning={isLoading}
          indicator={<Loading />}
          percent={0}
          fullscreen
        />
      )}
    </>
  );
}
