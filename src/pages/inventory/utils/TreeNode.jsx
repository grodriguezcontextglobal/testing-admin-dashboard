// TreeNode.jsx
import { Icon } from "@iconify/react";
import { useQueryClient } from "@tanstack/react-query";
import { Checkbox, message, Modal } from "antd";
import PropTypes from "prop-types";
import { useId, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { usePermission } from "../../../hooks/usePermission";
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
  rootLocationId = null,
}) => {
  const { user } = useSelector((state) => state.admin);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedName, setEditedName] = useState(nodeName);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canManageLocation = usePermission("inventory:manage_location");

  const { total, available, children, types } = nodeData;
  const nodeId = nodeData?.location_id || nodeData?._id || nodeData?.id;
  // The owning top-level location's id, threaded down through recursion so
  // sub-location nodes (which carry no id of their own) can be targeted.
  const effectiveRootId = rootLocationId ?? nodeId;
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

  // A node is deletable when it's empty AND either a top-level location (has an
  // id) or a sub-location path under a known location. Sub-location paths are
  // identified by (company_id, location_id, path segments).
  const isTopLevelLocation = !!nodeId;
  const isSubLocationPath = !nodeId && depth > 0 && !!effectiveRootId;
  const canDelete =
    canManageLocation && !hasDevices && (isTopLevelLocation || isSubLocationPath);

  // Delete an empty location or sub-location. For sub-locations the whole
  // (empty) subtree is removed by the backend, so we say so in the prompt.
  const handleDeleteEmpty = () => {
    if (!canDelete) return;
    const childCount = subLocationNames.length;
    const content = isTopLevelLocation
      ? "This empty location will be permanently removed. This can't be undone."
      : childCount > 0
      ? `"${nodeName}" and its ${childCount} empty sub-location${
          childCount === 1 ? "" : "s"
        } will be permanently removed. This can't be undone.`
      : "This empty sub-location will be permanently removed. This can't be undone.";

    Modal.confirm({
      title: `Delete "${nodeName}"?`,
      content,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      centered: true,
      onOk: async () => {
        try {
          if (isTopLevelLocation) {
            await devitrakApi.post(`/db_location/locations/${nodeId}`);
          } else {
            const response = await devitrakApi.post(
              "/db_location/sub-location-path/delete",
              {
                company_id: user.sqlInfo.company_id,
                location_id: effectiveRootId,
                sub_location_path: path.slice(1),
              }
            );
            if (!response?.data?.ok) {
              throw new Error(response?.data?.msg || "Delete failed");
            }
          }
          message.success(`"${nodeName}" deleted`);
          queryClient.invalidateQueries("structuredCompanyInventory");
          queryClient.invalidateQueries("locationsAndSublocationsWithTypes");
          queryClient.invalidateQueries(["locationPathsTree"]);
          await clearCacheMemory(`company_id=${user.sqlInfo.company_id}`);
        } catch (error) {
          console.error("Error deleting location:", error);
          message.error(
            error.response?.data?.msg ||
              "Failed to delete. Please try again."
          );
        }
      },
    });
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
        {canManageLocation && nodeId && onSelectLocation && isSelectable && (
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
            <button
              type="button"
              className="tree-row__action-btn"
              onClick={handleEdit}
              title="Rename location"
              aria-label="Rename location"
            >
              <EditIcon />
            </button>
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
            {canDelete && (
              <button
                type="button"
                className="tree-row__action-btn tree-row__action-btn--danger"
                onClick={handleDeleteEmpty}
                title={
                  isTopLevelLocation
                    ? "Delete empty location"
                    : "Delete empty sub-location"
                }
                aria-label={
                  isTopLevelLocation
                    ? "Delete empty location"
                    : "Delete empty sub-location"
                }
              >
                <Icon
                  icon="tabler:trash"
                  width={18}
                  height={18}
                  color="var(--error-600, #d92d20)"
                />
              </button>
            )}
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
                rootLocationId={effectiveRootId}
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
  rootLocationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
