import { Icon } from "@iconify/react/dist/iconify.js";
import { Typography } from "@mui/material";
import { Avatar } from "antd";
import { GeneralDeviceIcon } from "../../../components/icons/GeneralDeviceIcon";
import { RightNarrowInCircle } from "../../../components/icons/RightNarrowInCircle";
import { Subtitle } from "../../../styles/global/Subtitle";
import "../../../styles/global/ant-table.css";
import { cellStyle, dictionary } from "../details/utils/dataStructuringFormat";
import FilterIconSVG from "../../../components/icons/filter.svg";
const columnsTableMain = ({
  groupingByDeviceType,
  navigate,
  responsive,
  data = [],
}) => {
  // Generate dynamic filters based on actual data
  const generateFilters = (dataKey) => {
    const uniqueValues = [
      ...new Set(
        data
          .map((item) => {
            if (dataKey.includes(".")) {
              const keys = dataKey.split(".");
              return keys.reduce((obj, key) => obj?.[key], item);
            }
            return item[dataKey];
          })
          .filter(Boolean)
      ),
    ];

    return uniqueValues.map((value) => ({
      text:
        typeof value === "string"
          ? value.charAt(0).toUpperCase() + value.slice(1)
          : value,
      value: value,
    }));
  };

  const columns = [
    {
      title: "Device category",
      dataIndex: "data",
      key: "data",
      filterIcon: <img src={FilterIconSVG} alt="" width={20} height={20} />,
      showSorterTooltip: { target: "full-header" },
      filters: generateFilters("category_name"),
      onFilter: (value, record) => record.category_name === value,
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
      showSorterTooltip: { target: "full-header" },
      filterIcon: <img src={FilterIconSVG} alt="" width={20} height={20} />,
      filters: generateFilters("item_group"),
      onFilter: (value, record) => record.item_group === value,
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
      filterIcon: <img src={FilterIconSVG} alt="" width={20} height={20} />,
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
      filterIcon: <img src={FilterIconSVG} alt="" width={20} height={20} />,
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
      showSorterTooltip: { target: "full-header" },
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
      dataIndex: "",
      key: "action",
      responsive: responsive[7],
      render: (_, record) => (
        <button
          style={{
            ...cellStyle,
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Try multiple approaches to find the item_id
            let itemId = null;
            if (record.item_id) {
              itemId = record.item_id;
            } else if (record.data?.item_id) {
              itemId = record.data.item_id;
            } else if (record.key && record.key.includes("-")) {
              itemId = record.key.split("-")[0];
            }
            if (itemId) {
              navigate(`/inventory/item?id=${itemId}`);
            } else {
              // Show user-friendly error or fallback behavior
              alert("Unable to navigate to item details. Please try again.");
            }
          }}
        >
          <RightNarrowInCircle />
        </button>
      ),
    },
  ];
  return columns;
};

export default columnsTableMain;
