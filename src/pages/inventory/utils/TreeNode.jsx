// TreeNode.jsx
import { Grid, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Button, message, Checkbox } from "antd";
import PropTypes from "prop-types";
import { useId, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { DownNarrow } from "../../../components/icons/DownNarrow";
import { EditIcon } from "../../../components/icons/EditIcon";
import { RightNarrowInCircle } from "../../../components/icons/RightNarrowInCircle";
import { UpNarrowIcon } from "../../../components/icons/UpNarrowIcon";
import ViewIcon from "../../../components/icons/ViewIcon";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import clearCacheMemory from "../../../utils/actions/clearCacheMemory";
import "../style/viewtree.css";

const TreeNode = ({
  nodeName,
  nodeData,
  path,
  onUpdateLocation,
  setTypePerLocationInfoModal,
  setOpenDetails,
  selectedLocations,
  onSelectLocation,
}) => {
  const { user } = useSelector((state) => state.admin);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedName, setEditedName] = useState(nodeName);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // if (!nodeData) return null;

  const { total, available, children, types } = nodeData;
  const nodeId = nodeData?.location_id || nodeData?._id || nodeData?.id;
  const isSelectable = total === 0;

  const toggleOpen = () => {
    if (children) setIsOpen(!isOpen);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedName(nodeName);
  };
  const handleSave = async () => {
    try {
      if (editedName === nodeName) {
        setIsEditing(false);
        return;
      }
      setIsLoading(true);
      // Use global message API with a stable key to update status
      message.open({
        type: "loading",
        content: "Updating location path...",
        duration: 0,
        key: "updateLocationPath",
      });
      const locationData = {
        newName: editedName,
        path: path,
        currentIndex: path.length - 1,
        company_id: user.sqlInfo.company_id,
      };

      const response = await devitrakApi.post(
        "/db_inventory/update-location-sub-location",
        locationData
      );
      if (response?.data?.ok) {
        queryClient.invalidateQueries("structuredCompanyInventory");
        queryClient.invalidateQueries("listOfItemsInStock");
        queryClient.invalidateQueries("ItemsInInventoryCheckingQuery");
        queryClient.invalidateQueries("RefactoredListInventoryCompany");
        await clearCacheMemory(`company_id=${user.sqlInfo.company_id}`);
        setIsEditing(false);
        setIsLoading(false);
        // Update the same message key to success (no destroy needed)
        message.open({
          type: "success",
          content: `Location/Sub locations updated successfully. Total: ${
            response.data.affectedRows ?? 0
          }`,
          duration: 2.5,
          key: "updateLocationPath",
        });
        return;
      }
    } catch (error) {
      console.error("Error updating location:", error);
      setIsLoading(false);
      setEditedName(nodeName);
      setIsEditing(false);
      // Optional: show error with a different key
      message.open({
        type: "error",
        content: "Failed to update location path.",
        duration: 2.5,
        key: "updateLocationPath",
      });
    }
  };

  const handleCancel = () => {
    setEditedName(nodeName);
    setIsEditing(false);
  };

  const style = {
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
    margin: 0,
    padding: 0,
    width: "fit-content",
    boxShadow: "none",
  };

  const navigateToLocation = (location) => {
    const check = checkUpdatedPath(location);
    if (check) {
      if (location.length === 1) {
        return navigate(
          `/inventory/location?${encodeURI(location[0])}&search=`
        );
      } else {
        const subLocationPath = encodeURIComponent(location.slice(1).join(","));
        return navigate(
          `/inventory/location?${encodeURI(location[0])}&search=`,
          {
            state: {
              sub_location: subLocationPath,
            },
          }
        );
      }
    } else {
      return message.warning("Please wait while the path is being updated.");
    }
  };

  const checkUpdatedPath = (path) => {
    const checking = path.some((item) => item === editedName);
    return checking;
  };

  // Normalize types to table rows safely (supports array/object/empty)
  const normalizeTypesToRows = (input) => {
    const rows = [];
    if (!input) return rows;

    if (Array.isArray(input)) {
      if (input.length === 0) return rows;
      // Array of strings -> count occurrences
      if (typeof input[0] === "string") {
        const counts = {};
        for (const t of input) {
          const key = String(t ?? "").trim();
          if (!key) continue;
          counts[key] = (counts[key] || 0) + 1;
        }
        let idx = 1;
        for (const [type, qty] of Object.entries(counts)) {
          rows.push({
            key: `${type}-${idx}`,
            type,
            qty: Number(qty) || 0,
            index: idx,
          });
          idx += 1;
        }
      } else if (typeof input[0] === "object") {
        // Array of objects { type, qty } or similar
        let idx = 1;
        for (const item of input) {
          const type = String(item?.type ?? item?.name ?? "").trim();
          const qty =
            Number(item?.qty ?? item?.quantity ?? item?.count ?? 0) || 0;
          if (!type) continue;
          rows.push({ key: `${type}-${idx}`, type, qty, index: idx });
          idx += 1;
        }
      }
    } else if (typeof input === "object") {
      // Map of { typeName: qty }
      let idx = 1;
      for (const [typeName, quantity] of Object.entries(input)) {
        const type = String(typeName ?? "").trim();
        const qty = Number(quantity ?? 0) || 0;
        if (!type) continue;
        rows.push({ key: `${type}-${idx}`, type, qty, index: idx });
        idx += 1;
      }
    }
    return rows;
  };
  const rows = useMemo(() => normalizeTypesToRows(types), [types]);
  const id_key = useId();
  const columns = [
    {
      title: "#",
      dataIndex: "index",
      key: "index",
      width: 60,
    },
    {
      title: "Item Type",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Qty",
      dataIndex: "qty",
      key: "qty",
      width: 80,
    },
  ];

  const safeSetTypePerLocationInfoModal =
    typeof setTypePerLocationInfoModal === "function"
      ? setTypePerLocationInfoModal
      : null;

  const clickTypeLocationInfo = () => {
    if (safeSetTypePerLocationInfoModal) {
      safeSetTypePerLocationInfoModal({
        rows,
        id_key,
        columns,
        nodeName,
      });
    }
  };

  return (
    <div
      key={nodeName}
      className="tree-card"
      style={{
        backgroundColor: selectedLocations?.has(nodeId)
          ? "rgba(24, 144, 255, 0.1)"
          : "transparent",
        transition: "background-color 0.3s",
        borderRadius: "4px",
        // opacity: isSelectable ? 1 : 0.6,
      }}
    >
      {/* Removed contextHolder to avoid hooking per-node message portals */}
      <Grid container style={{ cursor: children ? "pointer" : "default" }}>
        <Grid
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <Button htmlType="button" style={style} onClick={toggleOpen}>
            <Typography
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: { xs: "24px", md: "30px" },
                lineHeight: { xs: "32px", md: "38px" },
                textWrap: "balance",
              }}
              className="tree-title"
            >
              {children && (isOpen ? <UpNarrowIcon /> : <DownNarrow />)}{" "}
              {Number(user.role) === 0 && nodeId && onSelectLocation && (
                <span onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedLocations?.has(nodeId)}
                    onChange={() => onSelectLocation(nodeId)}
                    style={{ margin: "0 8px" }}
                    disabled={!isSelectable}
                    aria-disabled={!isSelectable}
                  />
                </span>
              )}
              <span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    style={{
                      fontSize: "20px",
                      lineHeight: "24px",
                      width: "auto",
                      minWidth: "100px",
                    }}
                    autoFocus
                  />
                ) : (
                  editedName
                )}
              </span>
              <div
                style={{ display: "flex", gap: "5px", width: "fit-content" }}
              >
                {isEditing ? (
                  <>
                    {" "}
                    <BlueButtonComponent
                      buttonType="button"
                      func={handleSave}
                      title={"Save"}
                      loadingState={isLoading}
                    />
                    &nbsp;
                    <GrayButtonComponent
                      buttonType="button"
                      func={handleCancel}
                      title={"Cancel"}
                      disabled={isLoading}
                    />
                  </>
                ) : (
                  <Button
                    style={{
                      borderRadius: "25px",
                      width: "fit-content",
                      aspectRatio: "1/1",
                      marginLeft: "5px",
                    }}
                    onClick={handleEdit}
                    disabled={Number(user.role) > 0}
                  >
                    <EditIcon />
                  </Button>
                )}
                <GrayButtonComponent
                  styles={{
                    padding: "2.5px !important",
                    borderRadius: "50% !important",
                  }}
                  icon={<ViewIcon />}
                  func={() => {
                    clickTypeLocationInfo();
                    setOpenDetails(true);
                  }}
                />
              </div>
            </Typography>
          </Button>
          <Button
            htmlType="button"
            style={style}
            onClick={() => navigateToLocation(path)}
          >
            <RightNarrowInCircle />
          </Button>
        </Grid>
        <Grid className="tree-sub" item xs={12}>
          Total: {total}, Available: {available}
        </Grid>
      </Grid>

      {isOpen && children && (
        <div className="tree-children">
          {Object.entries(children)
            .filter(([key]) => key !== "null")
            .map(([childName, childData]) => (
              <TreeNode
                key={childName}
                nodeName={childName}
                nodeData={childData}
                path={[...path, childName]}
                onUpdateLocation={onUpdateLocation}
                setTypePerLocationInfoModal={setTypePerLocationInfoModal}
                setOpenDetails={setOpenDetails}
                selectedLocations={selectedLocations}
                onSelectLocation={onSelectLocation}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default TreeNode;

TreeNode.propTypes = {
  nodeName: PropTypes.string.isRequired,
  nodeData: PropTypes.shape({
    total: PropTypes.number,
    available: PropTypes.number,
    children: PropTypes.object,
    types: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    location_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  path: PropTypes.arrayOf(PropTypes.string).isRequired,
  onUpdateLocation: PropTypes.func,
  setTypePerLocationInfoModal: PropTypes.func,
  setOpenDetails: PropTypes.func,
  selectedLocations: PropTypes.instanceOf(Set),
  onSelectLocation: PropTypes.func,
};
