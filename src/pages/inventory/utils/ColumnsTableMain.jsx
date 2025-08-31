import { Icon } from "@iconify/react/dist/iconify.js";
import { Typography } from "@mui/material";
import { Avatar } from "antd";
import { GeneralDeviceIcon } from "../../../components/icons/GeneralDeviceIcon";
import { RightNarrowInCircle } from "../../../components/icons/RightNarrowInCircle";
import { Subtitle } from "../../../styles/global/Subtitle";
import "../../../styles/global/ant-table.css";
import { cellStyle, dictionary } from "../details/utils/dataStructuringFormat";
const columnsTableMain = ({ groupingByDeviceType, navigate, responsive }) => {
  const columns = [
    {
      title: "Device category",
      dataIndex: "data",
      key: "data",
      sorter: {
        compare: (a, b) =>
          ("" + a.data.item_group).localeCompare(b.data.item_group),
      },
      responsive: responsive[0],
      render: (record) => (
        <span style={cellStyle}>
          <Avatar
            size={"80px"}
            style={{ borderRadius: "8px", background: "transparent" }}
          >
            {record.image_url || groupingByDeviceType[record.item_group] ? (
              <img
                src={
                  record.image_url ||
                  groupingByDeviceType[record.item_group][0].source
                }
                alt={`${record.item_group}-${record.serial_number}`}
                style={{ width: "100%", height: "auto" }}
              />
            ) : (
              <Avatar size={"80px"}>
                <GeneralDeviceIcon />
              </Avatar>
            )}
          </Avatar>
          {/*  */}
          &nbsp;{" "}
          <Typography
            style={{ ...Subtitle, cellStyle }}
            textTransform={"capitalize"}
          >
            {record.category_name}
          </Typography>
        </span>
      ),
    },
    {
      title: "Device name",
      dataIndex: "item_group",
      key: "item_group",
      sorter: {
        compare: (a, b) => ("" + a.item_group).localeCompare(b.item_group),
      },
      responsive: responsive[1],
      render: (item_group) => (
        <span style={cellStyle}>
          {" "}
          <Typography style={Subtitle} textTransform={"capitalize"}>
            {item_group}
          </Typography>
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "warehouse",
      key: "warehouse",
      showSorterTooltip: { target: "full-header" },
      filters: [
        {
          text: "In Stock",
          value: 1,
        },
        {
          text: "In Use",
          value: 0,
        },
      ],
      onFilter: (value, record) => record.warehouse === value,
      sorter: {
        compare: (a, b) => ("" + a.warehouse).localeCompare(b.warehouse),
      },
      responsive: responsive[2],
      render: (warehouse) => {
        // if (record.enableAssignFeature === 1) {
        return (
          <span
            style={{
              ...cellStyle,
              borderRadius: "16px",
              justifyContent: "center",
              display: "flex",
              padding: "2px 8px",
              alignItems: "center",
              background: `${
                warehouse === 0
                  ? "var(--blue-50, #EFF8FF)"
                  : "var(--success-50, #ECFDF3)"
              }`,
              width: "fit-content",
            }}
          >
            <p
              style={{
                color: `${
                  warehouse === 0
                    ? "var(--blue-700, #175CD3)"
                    : "var(--success-700, #027A48)"
                }`,
                textTransform: "capitalize",
              }}
            >
              <Icon
                icon="tabler:point-filled"
                rotate={3}
                color={`${warehouse === 0 ? "#2E90FA" : "#12B76A"}`}
              />
              {warehouse === 0 ? "In Use" : "In Stock"}
            </p>
          </span>
        );
      },
    },
    {
      title: "Ownership",
      dataIndex: "ownership",
      key: "ownership",
      showSorterTooltip: { target: "full-header" },
      filters: [
        {
          text: "Leased",
          value: "Rent",
        },
        {
          text: "Owned",
          value: "Permanent",
        },
        {
          text: "Sale",
          value: "Sale",
        },
      ],
      onFilter: (value, record) => record.ownership === value,
      sorter: {
        compare: (a, b) => ("" + a.ownership).localeCompare(b.ownership),
      },
      responsive: responsive[3],
      render: (ownership) => (
        <span
          style={{
            ...cellStyle,
            borderRadius: "16px",
            justifyContent: "center",
            display: "flex",
            padding: "2px 8px",
            alignItems: "center",
            background: `${
              ownership === "Permanent"
                ? "var(--blue-50, #EFF8FF)"
                : "var(--success-50, #ECFDF3)"
            }`,
            width: "fit-content",
          }}
        >
          <Typography
            color={`${
              ownership === "Permanent"
                ? "var(--blue-700, #175CD3)"
                : "var(--success-700, #027A48)"
            }`}
            style={Subtitle}
            textTransform={"capitalize"}
          >
            <Icon
              icon="tabler:point-filled"
              rotate={3}
              color={`${ownership === "Permanent" ? "#2E90FA" : "#12B76A"}`}
            />
            {dictionary[ownership]}
          </Typography>
        </span>
      ),
    },
    {
      title: "Taxable address",
      dataIndex: "data",
      key: "data",
      sorter: {
        compare: (a, b) =>
          ("" + a.data.main_warehouse).localeCompare(b.data.main_warehouse),
      },
      responsive: responsive[4],
      render: (data) => (
        <span style={cellStyle}>
          {" "}
          <Typography style={Subtitle} textTransform={"capitalize"}>
            {data.main_warehouse}
          </Typography>
        </span>
      ),
    },
    {
      title: "Location",
      dataIndex: "data",
      key: "data",
      sorter: {
        compare: (a, b) =>
          ("" + a.data.location).localeCompare(b.data.location),
      },
      responsive: responsive[5],
      render: (data) => (
        <span style={cellStyle}>
          {" "}
          <Typography style={Subtitle} textTransform={"capitalize"}>
            {data.warehouse === 1 ? data.location : data.event_name}
          </Typography>
        </span>
      ),
    },
    {
      title: "Main Serial Number",
      dataIndex: "serial_number",
      key: "serial_number",
      sorter: (a, b) => a.serial_number - b.serial_number,
      responsive: responsive[6],
      render: (serial_number) => (
        <span style={cellStyle}>
          {" "}
          <Typography style={Subtitle} textTransform={"capitalize"}>
            {serial_number}
          </Typography>
        </span>
      ),
    },
    {
      title: "",
      dataIndex: "data",
      key: "data",
      responsive: responsive[7],
      render: (record) => (
        <button
          style={{
            ...cellStyle,
            backgroundColor: "transparent",
            border: "none",
          }}
          onClick={() => navigate(`/inventory/item?id=${record.item_id}`)}
        >
          <RightNarrowInCircle />
        </button>
      ),
    },
  ];
  return columns;
};

export default columnsTableMain;
