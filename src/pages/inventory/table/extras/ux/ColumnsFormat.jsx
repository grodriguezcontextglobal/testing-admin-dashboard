import { Icon } from "@iconify/react/dist/iconify.js";
import { ownershipLabel } from "../../../actions/utils/ownershipUtils";
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
// import { getLogisticStatusColor } from "../../../utils/logisticStatusConfig";

/**
 * @param {boolean} serverSorted - true once FEATURE_INVENTORY_SERVER_PAGINATION
 *   is on. Ordering then belongs to MySQL, across the whole filtered set, so
 *   every comparator here has to go: re-sorting the fifty rows of the current
 *   page on top of that would leave each page internally tidy and wrong
 *   relative to its neighbours. antd's `sorter: true` is the way to say "this
 *   column sorts, but not by me" — it draws the arrows and fires onChange.
 * @param {string} sortBy - the column the server is currently ordering by.
 * @param {"asc"|"desc"} sortDir
 */
const ColumnsFormat = ({
  navigate,
  cellStyle,
  serverSorted = false,
  sortBy = null,
  sortDir = "asc",
  // userPreferences,
}) => {
  /**
   * The sorter for a column, in whichever mode is active. `sortOrder` is set
   * explicitly in server mode so the arrow survives a page change — antd would
   * otherwise forget which column is sorted as soon as the rows are replaced.
   */
  const sortFor = (key, compare) =>
    serverSorted
      ? {
          sorter: true,
          sortOrder:
            sortBy === key ? (sortDir === "desc" ? "descend" : "ascend") : null,
        }
      : { sorter: { compare } };
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
      ...sortFor("category_name", (a, b) =>
        ("" + a.category_name).localeCompare(b.category_name),
      ),
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
      ...sortFor("item_group", (a, b) =>
        ("" + a.item_group).localeCompare(b.item_group),
      ),
      title: "Device name",
    },
    {
      // In server mode this column moves onto the field it actually paints.
      // It sorted by `warehouse` and displayed `logistic_status`, so clicking
      // the header reordered by something the user cannot see — and `warehouse`
      // is an int flag (1 in stock, 0 out), which localeCompare was sorting as
      // text on top of that.
      dataIndex: serverSorted ? "logistic_status" : "warehouse",
      key: serverSorted ? "logistic_status" : "warehouse",
      render: (_value, record) => {
        // The server contract drops the duplicated `data: <raw item>` each row
        // carried, and this was its only reader. The top-level field is present
        // in both branches, so reading it here is behaviour-identical today.
        const status = record?.logistic_status;
        // console.log(status, getLogisticStatusColor(status))
        // const backgroundColor = {
        //   allocated: "brand",
        //   archived: "danger",
        //   assigned: "info",
        //   "awaiting-pickup": "warning",
        //   damaged: "danger",
        //   "in-container": "info",
        //   "in-event": "info",
        //   "in-reserved": "info",
        //   "in-stock": "success",
        //   "in-transit": "info",
        //   "in-use": "info",
        //   lost: "danger",
        //   "pending-checkin": "warning",
        //   "ready-for-restock": "success",
        //   reserved: "info",
        //   returned: "success",
        //   shipped: "success",
        //   "under-inspection": "warning",
        //   "under-maintenance": "danger",
        // }
        // console.log(status, backgroundColor[status])
        return (
          <PillUIComponent
            color={status === "in-stock" ? "success" : status === "in-transit" ? "warning" : status === "in-event" ? "brand" : status === "shipped" ? "brand":"success"} //{backgroundColor[status]}
            size="sm"
          >{warehouseDicStatus[status] || ""}
          </PillUIComponent>
        );
      },
      ...sortFor(serverSorted ? "logistic_status" : "warehouse", (a, b) =>
        ("" + a.warehouse).localeCompare(b.warehouse),
      ),
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
            {ownershipLabel(ownership)}
          </span>
        </PillUIComponent>
      ),
      ...sortFor("ownership", (a, b) =>
        ("" + a.ownership).localeCompare(b.ownership),
      ),
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
      ...sortFor("main_warehouse", (a, b) =>
        ("" + a.main_warehouse).localeCompare(b.main_warehouse),
      ),
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
      ...sortFor("location", (a, b) =>
        ("" + a.location).localeCompare(b.location),
      ),
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
      // Text, not arithmetic: serials carry a trailing counter, so `a - b`
      // yields NaN for every pair. Server mode orders them as text too, which
      // is what the localeCompare below matches.
      ...sortFor("serial_number", (a, b) =>
        ("" + a.serial_number).localeCompare(b.serial_number),
      ),
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
