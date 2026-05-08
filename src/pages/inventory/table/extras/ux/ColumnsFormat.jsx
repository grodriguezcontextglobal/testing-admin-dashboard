import { Icon } from "@iconify/react/dist/iconify.js";
import {
  // Space, 
  Tooltip,
  Typography,
} from "@mui/material";
import { Avatar } from "antd";
import { GeneralDeviceIcon } from "../../../../../components/icons/GeneralDeviceIcon";
import { RightNarrowInCircle } from "../../../../../components/icons/RightNarrowInCircle";
import PillUIComponent from "../../../../../components/UX/Chip/PillUIComponent";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { warehouseDicStatus } from "../../../utils/warehouseDicStatus";
import { getLogisticStatusColor } from "../../../utils/logisticStatusConfig";

const ColumnsFormat = ({
  dictionary,
  navigate,
  cellStyle,
  // userPreferences,
}) => {
  // Helper to check permissions for a specific location and action
  // const checkPermission = (locationName, action) => {
  //   if (!userPreferences?.managerLocation) return false;

  //   // Find the permission object for this location
  //   // Using includes for partial matching since location names might vary slightly
  //   const locationPerm = userPreferences.managerLocation.find(
  //     (loc) =>
  //       loc.location &&
  //       String(locationName)
  //         .toLowerCase()
  //         .includes(String(loc.location).toLowerCase())
  //   );

  //   if (!locationPerm || !locationPerm.actions) return false;
  //   return !!locationPerm.actions[action];
  // };

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
            style={{ background: "transparent", borderRadius: "8px" }}
          >
            {record.image_url ? (
              <img
                src={record.image_url}
                alt={`${record.item}-${record.item_group}-${record.serial_number}`}
                style={{ height: "auto", width: "100%" }}
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
      dataIndex: "item_group",
      key: "item_group",
      render: (item_group) => (
        <span style={cellStyle}>
          {" "}
          <Typography style={Subtitle} textTransform={"capitalize"}>
            {item_group}
          </Typography>
        </span>
      ),
      sorter: {
        compare: (a, b) => ("" + a.item_group).localeCompare(b.item_group),
      },
      title: "Device name",
    },
    {
      dataIndex: "warehouse",
      key: "warehouse",
      render: (warehouse, record) => {
        const status = record?.data?.logistic_status;
        return (
          <PillUIComponent
            color={getLogisticStatusColor(status)}
            size="sm"
          >{warehouseDicStatus[status] || ""}</PillUIComponent>
        );
      },
      sorter: {
        compare: (a, b) => ("" + a.warehouse).localeCompare(b.warehouse),
      },
      title: "Status",
    },
    {
      dataIndex: "ownership",
      key: "ownership",
      render: (ownership) => (
        <PillUIComponent
          color={ownership === "Permanent" ? "brand" : "success"}
          size="sm"
        >
          <Icon icon="tabler:point-filled" rotate={3} />
          <span style={{ textTransform: "capitalize", marginLeft: "2px" }}>
            {dictionary[ownership]}
          </span>
        </PillUIComponent>
      ),
      sorter: {
        compare: (a, b) => ("" + a.ownership).localeCompare(b.ownership),
      },
      title: "Ownership",
    },
    {
      dataIndex: "main_warehouse",
      key: "main_warehouse",
      render: (main_warehouse) => (
        <span style={cellStyle}>
          {" "}
          <Typography style={Subtitle} textTransform={"capitalize"}>
            {main_warehouse}
          </Typography>
        </span>
      ),
      sorter: {
        compare: (a, b) =>
          ("" + a.main_warehouse).localeCompare(b.main_warehouse),
      },
      title: "Taxable address",
    },
    {
      dataIndex: "location",
      key: "location",
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
      sorter: {
        compare: (a, b) => ("" + a.location).localeCompare(b.location),
      },
      title: "Location",
    },
    {
      dataIndex: "serial_number",
      key: "serial_number",
      render: (serial_number) => (
        <span style={cellStyle}>
          {" "}
          <Typography style={Subtitle} textTransform={"capitalize"}>
            {serial_number}
          </Typography>
        </span>
      ),
      sorter: (a, b) => a.serial_number - b.serial_number,
      title: "Main Serial Number",
    },
    {
      title: "Actions",
      key: "actions",
      responsive: ["lg"],
      render: (_, record) => {
        // const locationName = record.location;
        // const canUpdate = checkPermission(locationName, "update");
        // const canDelete = checkPermission(locationName, "delete");
        // const canTransfer = checkPermission(locationName, "transfer");

        return (
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: "8px",
              justifyContent: "flex-end",
            }}
          >
            {/* {canUpdate && (
              <Tooltip title="Edit Item">
                <AntButton
                  type="text"
                  icon={<EditOutlined style={{ color: "#1890ff" }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Edit action clicked for", record.item_id);
                  }}
                />
              </Tooltip>
            )}

            {canTransfer && (
              <Tooltip title="Transfer Item">
                <AntButton
                  type="text"
                  icon={<SwapOutlined style={{ color: "#faad14" }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Transfer action clicked");
                  }}
                />
              </Tooltip>
            )}

            {canDelete && (
              <Tooltip title="Delete Item">
                <AntButton
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Delete action clicked");
                  }}
                />
              </Tooltip>
            )} */}

            <Tooltip title="View Details">
              <button
                style={{
                  ...cellStyle,
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/inventory/item?id=${record.item_id}`)}
              >
                <RightNarrowInCircle />
              </button>
            </Tooltip>
          </div>
        );
      },
    },
  ];
  return columns;
};

export default ColumnsFormat;
