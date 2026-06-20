// TreeNode.jsx
import { useQueryClient } from "@tanstack/react-query";
import { Checkbox, message } from "antd";
import PropTypes from "prop-types";
import { useId, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { DownNarrow } from "../../../components/icons/DownNarrow";
import { EditIcon } from "../../../components/icons/EditIcon";
import { RightChevronIcon } from "../../../components/icons/RightChevronIcon";
import { RightNarrowInCircle } from "../../../components/icons/RightNarrowInCircle";
import ViewIcon from "../../../components/icons/ViewIcon";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import clearCacheMemory from "../../../utils/actions/clearCacheMemory";
import { can } from "../../../config/roleCapabilities";
import "../style/viewtree.css";

const LOW_STOCK_RATIO = 0.25;

const TreeNode = ({
  nodeName,
  nodeData,
  path,
  depth = 0,
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
  // Rename/edit a location's name (Owner + Admin); deleting a location is Owner-only.
  const canEditStructure = can(user.role, "inventory.editStructure");
  const canDeleteLocation = can(user.role, "inventory.deleteLocation");

  const { total, available, children, types } = nodeData;
  const nodeId = nodeData?.location_id || nodeData?._id || nodeData?.id;
  const isSelectable = total === 0;
  const subLocationNames = children
    ? Object.keys(children).filter((key) => key !== "null")
    : [];
  const hasChildren = subLocationNames.length > 0;
  const hasDevices = typeof total === "number" && total > 0;
  const availabilityRatio = hasDevices ? available / total : null;
  const barColor =
    hasDevices && available === 0
      ? "var(--error-500, #F04438)"
      : hasDevices && availabilityRatio <= LOW_STOCK_RATIO
      ? "var(--warning-500, #F79009)"
      : "var(--success-500, #12B76A)";

  const toggleOpen = () => {
    if (hasChildren) setIsOpen(!isOpen);
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
        locationData,
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
          content: `Location/Sub locations updated successfully. Total: ${response.data.affectedRows ?? 0
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

  const navigateToLocation = (location) => {
    const check = checkUpdatedPath(location);
    if (check) {
      if (location.length === 1) {
        return navigate(
          `/inventory/location?${encodeURI(location[0])}&search=`,
        );
      } else {
        const subLocationPath = encodeURIComponent(location.slice(1).join(","));
        return navigate(
          `/inventory/location?${encodeURI(location[0])}&search=`,
          {
            state: {
              sub_location: subLocationPath,
            },
          },
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
      title: "Item Type",
      dataIndex: "type",
      key: "type",
    },
  ];

  const safeSetTypePerLocationInfoModal =
    typeof setTypePerLocationInfoModal === "function"
      ? setTypePerLocationInfoModal
      : null;

  const clickTypeLocationInfo = () => {
    if (safeSetTypePerLocationInfoModal) {
      safeSetTypePerLocationInfoModal({
        rows: [...rows], // Add total row to the existing rows
        id_key,
        columns,
        nodeName,
      });
    }
  };

  const rowClassNames = [
    "tree-row",
    depth > 0 ? "tree-row--child" : "",
    selectedLocations?.has(nodeId) ? "tree-row--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div key={nodeName} className="tree-node">
      <div
        className={rowClassNames}
        style={{ paddingLeft: `${16 + depth * 28}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="tree-row__chevron"
            onClick={toggleOpen}
            aria-label={isOpen ? "Collapse sub-locations" : "Expand sub-locations"}
            aria-expanded={isOpen}
          >
            {isOpen ? <DownNarrow /> : <RightChevronIcon />}
          </button>
        ) : (
          <span className="tree-row__chevron" aria-hidden="true" />
        )}
        {canDeleteLocation && nodeId && onSelectLocation && isSelectable && (
          <Checkbox
            checked={selectedLocations?.has(nodeId)}
            onChange={() => onSelectLocation(nodeId)}
            title="Select empty location for deletion"
          />
        )}
        {isEditing ? (
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <input
              type="text"
              className="tree-row__edit-input"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              autoFocus
            />
            <BlueButtonComponent
              buttonType="button"
              func={handleSave}
              title={"Save"}
              loadingState={isLoading}
            />
            <GrayButtonComponent
              buttonType="button"
              func={handleCancel}
              title={"Cancel"}
              disabled={isLoading}
            />
          </span>
        ) : (
          <span
            className={`tree-row__name ${
              hasChildren ? "tree-row__name--clickable" : ""
            } ${!hasDevices ? "tree-row__name--muted" : ""}`}
            onClick={toggleOpen}
          >
            {editedName}
          </span>
        )}
        {!isEditing && hasChildren && (
          <span className="tree-row__chip">
            {subLocationNames.length}{" "}
            {subLocationNames.length === 1 ? "sub-location" : "sub-locations"}
          </span>
        )}
        {!isEditing && !hasDevices && (
          <span className="tree-row__chip tree-row__chip--empty">Empty</span>
        )}
        <div className="tree-row__meta">
          <span className="tree-row__avail">
            {hasDevices
              ? `${Number(available ?? 0).toLocaleString()} of ${Number(
                  total,
                ).toLocaleString()} available`
              : "No devices"}
          </span>
          <div className="tree-row__track">
            {hasDevices && (
              <div
                className="tree-row__fill"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, Math.round((availabilityRatio ?? 0) * 100)),
                  )}%`,
                  background: barColor,
                }}
              />
            )}
          </div>
          <div className="tree-row__actions">
            {canEditStructure && (
              <button
                type="button"
                className="tree-row__action-btn"
                onClick={handleEdit}
                title="Rename location"
                aria-label="Rename location"
              >
                <EditIcon />
              </button>
            )}
            <button
              type="button"
              className="tree-row__action-btn"
              onClick={() => {
                clickTypeLocationInfo();
                setOpenDetails(true);
              }}
              title="View item types in this location"
              aria-label="View item types in this location"
            >
              <ViewIcon fill="#000000e0" />
            </button>
            <button
              type="button"
              className="tree-row__action-btn"
              onClick={() => navigateToLocation(path)}
              title="Open location"
              aria-label="Open location"
            >
              <RightNarrowInCircle />
            </button>
          </div>
        </div>
      </div>

      {isOpen && hasChildren && (
        <div className="tree-children">
          {Object.entries(children)
            .filter(([key]) => key !== "null")
            .map(([childName, childData]) => (
              <TreeNode
                key={childName}
                nodeName={childName}
                nodeData={childData}
                path={[...path, childName]}
                depth={depth + 1}
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
  depth: PropTypes.number,
  onUpdateLocation: PropTypes.func,
  setTypePerLocationInfoModal: PropTypes.func,
  setOpenDetails: PropTypes.func,
  selectedLocations: PropTypes.instanceOf(Set),
  onSelectLocation: PropTypes.func,
};
