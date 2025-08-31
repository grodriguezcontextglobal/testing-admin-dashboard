import { Typography } from "@mui/material";
import { RightNarrowInCircle } from "../../../../../components/icons/RightNarrowInCircle";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Avatar } from "antd";
import { GeneralDeviceIcon } from "../../../../../components/icons/GeneralDeviceIcon";

const ColumnsFormat = ({ dictionary, navigate, cellStyle }) => {
    const columns = [
    {
      title: "Device category",
      dataIndex: "category_name",
      key: "category_name",
      responsive: ["lg"],
      sorter: {
        compare: (a, b) =>
          ("" + a.category_name).localeCompare(b.category_name),
      },
      render: (category_name, record) => (
        <span style={cellStyle}>
          <Avatar
            size={"80px"}
            style={{ borderRadius: "8px", background: "transparent" }}
          >
            {record.image_url ? (
              <img
                src={record.image_url}
                alt={`${record.item}-${record.item_group}-${record.serial_number}`}
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
            {category_name}
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
      sorter: {
        compare: (a, b) => ("" + a.warehouse).localeCompare(b.warehouse),
      },
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
                width: "100%",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
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
      sorter: {
        compare: (a, b) => ("" + a.ownership).localeCompare(b.ownership),
      },
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
            style={{
              ...Subtitle,
              width: "100%",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
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
      dataIndex: "main_warehouse",
      key: "main_warehouse",
      sorter: {
        compare: (a, b) =>
          ("" + a.main_warehouse).localeCompare(b.main_warehouse),
      },
      render: (main_warehouse) => (
        <span style={cellStyle}>
          {" "}
          <Typography style={Subtitle} textTransform={"capitalize"}>
            {main_warehouse}
          </Typography>
        </span>
      ),
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      sorter: {
        compare: (a, b) => ("" + a.location).localeCompare(b.location),
      },
      render: (location) => {
        let result = location;
        if (String(result).toLowerCase().includes("leased equipment")) {
          const splittingName = String(result).split(" / ");
          result = splittingName.slice(1).toLocaleString().replaceAll(",", " ");
        } else if (String(result).toLowerCase().split(" / ")?.length === 3) {
          const splittingName = String(result).split(" / ");
          result = splittingName[1];
        }
        return (
          <span style={cellStyle}>
            <Typography
              style={{
                ...Subtitle,
                width: "100%",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              textTransform={"capitalize"}
            >
              {result}
            </Typography>
          </span>
        );
      },
    },
    {
      title: "Main Serial Number",
      dataIndex: "serial_number",
      key: "serial_number",
      sorter: (a, b) => a.serial_number - b.serial_number,
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
      dataIndex: "item_id",
      key: "item_id",
      responsive: ["lg"],
      render: (item_id) => (
        <button
          style={{
            ...cellStyle,
            backgroundColor: "transparent",
            border: "none",
          }}
          onClick={() => navigate(`/inventory/item?id=${item_id}`)}
        >
          <RightNarrowInCircle />
        </button>
      ),
    },
  ];
return columns;
};

export default ColumnsFormat;
