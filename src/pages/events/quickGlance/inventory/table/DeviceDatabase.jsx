import { Icon } from "@iconify/react";
import { Typography } from "@mui/material";
import { Space, Table, Tooltip } from "antd";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { onAddDeviceToDisplayInQuickGlance } from "../../../../../store/slices/devicesHandleSlice";
import "../../../../../styles/global/ant-table.css";
import checkTypeFetchResponse from "../../../../../components/utils/checkTypeFetchResponse";
const DeviceDatabase = ({ searchDevice, eventInventoryData }) => {
  const dataFormat =checkTypeFetchResponse(eventInventoryData.dataToRenderInComponent);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const columns = [
    {
      title: "Device type",
      dataIndex: "company",
      align: "left",
      responsive: ["lg"],
      sorter: {
        compare: (a, b) => ("" + a.company).localeCompare(b.company),
      },
      render: (company) => (
        <span key={`${company}`}>
          {company.map((detail, index) => {
            return (
              <div
                key={`${detail}+${index}`}
                style={{
                  flexDirection: "column",
                  color: `${
                    index === 0
                      ? "var(--gray-900, #101828)"
                      : "var(--gray-600, #475467)"
                  }`,
                  fontSize: "14px",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                  fontWeight: `${index === 0 ? "500" : null}`,
                }}
              >
                <Typography textTransform={"none"}>{detail}</Typography>
              </div>
            );
          })}
        </span>
      ),
    },
    {
      title: "Condition",
      dataIndex: "status",
      width: "20%",
      filterIcon: () => (
        <Tooltip title="Filter">
          <Icon icon="material-symbols:filter-alt" width={25} />
        </Tooltip>
      ),
      filters: [
        {
          text: "Network",
          value: "Network",
        },
        {
          text: "Hardware",
          value: "Hardware",
        },
        {
          text: "Damage",
          value: "Damage",
        },
        {
          text: "Battery",
          value: "Battery",
        },
        {
          text: "Lost",
          value: "Lost",
        },
        {
          text: "Other",
          value: "Other",
        },
      ],
      onFilter: (value, record) => record.status.startsWith(value),
      filterSearch: true,
      sorter: {
        compare: (a, b) => ("" + a.status).localeCompare(b.status),
      },
      render: (status) => (
        <span
          style={{
            alignItems: "center",
            background: `${
              String(status).toLowerCase() === "operational"
                ? "var(--blue-50, #EFF8FF)"
                : "#ffefef"
            }`,
            borderRadius: "16px",
            display: "flex",
            justifyContent: "center",
            padding: "2px 8px",
            width: "fit-content",
          }}
        >
          <Typography
            color={`${
              String(status).toLowerCase() === "operational"
                ? "var(--blue-700, #175CD3)"
                : "#d31717"
            }`}
            fontSize={"12px"}
            fontFamily={"Inter"}
            fontStyle={"normal"}
            fontWeight={500}
            lineHeight={"18px"}
            textAlign={"center"}
            textTransform={"capitalize"}
          >
            <Icon
              icon="tabler:point-filled"
              rotate={3}
              color={`${
                String(status).toLowerCase() === "operational"
                  ? "#2E90FA"
                  : "#d31717"
              }`}
            />
            {status}
          </Typography>
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "activity",
      width: "15%",
      filterIcon: () => (
        <Tooltip title="Filter">
          <Icon icon="material-symbols:filter-alt" width={25} />
        </Tooltip>
      ),
      filters: [
        {
          text: "In Use",
          value: true,
        },
        {
          text: "In Stock",
          value: false,
        },
        {
          text: "Lost",
          value: "LOST",
        },
      ],
      onFilter: (value, record) => record.activity === value,
      filterSearch: true,
      sorter: {
        compare: (a, b) => ("" + a.activity).localeCompare(b.activity),
      },
      render: (activity) => (
        <span
          style={{
            borderRadius: "16px",
            justifyContent: "center",
            display: "flex",
            padding: "2px 8px",
            alignItems: "center",
            background: `${
              activity === "LOST" || activity
                ? "var(--blue-50, #EFF8FF)"
                : "var(--success-50, #ECFDF3)"
            }`,
            width: "fit-content",
          }}
        >
          <Typography
            color={`${
              activity === "LOST" || activity
                ? "var(--blue-700, #175CD3)"
                : "var(--success-700, #027A48)"
            }`}
            fontSize={"12px"}
            fontFamily={"Inter"}
            fontStyle={"normal"}
            fontWeight={500}
            lineHeight={"18px"}
            textAlign={"center"}
            textTransform={"capitalize"}
          >
            <Icon
              icon="tabler:point-filled"
              rotate={3}
              color={`${
                activity === "LOST" || activity ? "#2E90FA" : "#12B76A"
              }`}
            />
            {activity === "LOST" ? "Lost" : activity ? "In Use" : "In Stock"}
          </Typography>
        </span>
      ),
    },
    {
      title: "Serial Number",
      dataIndex: "serialNumber",
      width: "25%",
      sorter: {
        compare: (a, b) => ("" + a.serialNumber).localeCompare(b.serialNumber),
      },
      render: (serialNumber) => (
        <span>
          <Typography
            textTransform={"capitalize"}
            fontSize={"14px"}
            fontFamily={"Inter"}
            fontStyle={"normal"}
            fontWeight={400}
            lineHeight={"20px"}
          >
            {serialNumber}
          </Typography>
        </span>
      ),
    },
    {
      title: "",
      key: "action",
      align: "right",
      width: "10%",
      render: (_, record) => (
        <Space size="middle">
          <Link to="/device-quick-glance">
            <Icon
              icon="fluent:arrow-circle-right-20-regular"
              color="#475467"
              width={25}
              height={25}
              onClick={() =>
                dispatch(onAddDeviceToDisplayInQuickGlance(record))
              }
            />
          </Link>
        </Space>
      ),
    },
  ];
  const sortDataPerEventAndCompany = () => {
    const list = dataFormat;
    if (list) {
      if (searchDevice?.length > 0) {
        const check = list?.filter((item) =>
          JSON.stringify(item)
            .toLowerCase()
            .includes(`${searchDevice}`.toLowerCase())
        );
        return check;
      }
      return list;
    }
    return [];
  };
  useEffect(() => {
    const controller = new AbortController();
    sortDataPerEventAndCompany();
    return () => {
      controller.abort();
    };
  }, []);

  const getInfoNeededToBeRenderedInTable = () => {
    const result = new Set();
    let mapTemplate = {};
    if (sortDataPerEventAndCompany()) {
      for (let data of sortDataPerEventAndCompany()) {
        mapTemplate = {
          company: [data.type, data.provider],
          activity:
            String(data.status).toLowerCase() === "lost"
              ? "LOST"
              : data.activity,
          status: data.status,
          serialNumber: data.device,
          user: data.activity,
          entireData: data,
        };
        result.add(mapTemplate);
      }
    }
    const resultIntoArray = Array.from(result);
    return resultIntoArray;
  };
  return (
    <Table
      sticky
      size="large"
      columns={columns}
      dataSource={getInfoNeededToBeRenderedInTable()}
      pagination={{
        position: ["bottomCenter"],
      }}
      className="table-ant-customized"
      style={{ cursor: "pointer" }}
      onRow={(record) => {
        return {
          onClick: () => {
            dispatch(onAddDeviceToDisplayInQuickGlance(record));
            navigate("/device-quick-glance");
          },
        };
      }}
    />
  );
  // }
};

export default DeviceDatabase;
