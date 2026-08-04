import { Icon } from "@iconify/react";

/**
 * Builds the antd Dropdown items for the "Manage members" control on the
 * members list page. Mirrors the staff MainPage "Manage staff" menu: an add
 * action, a divider, a danger delete action, and an export action — each
 * separated by a divider only when both neighboring sections are present.
 *
 * @param {object}   params
 * @param {string}   params.titleParams  singular/plural label (e.g. "members")
 * @param {Function} [params.onAdd]      handler for the add action
 * @param {Function} [params.onDelete]   handler for the delete action
 * @param {Function} [params.onExport]   handler for the export action
 * @param {boolean}  [params.canAdd]     include the add action (default true)
 * @param {boolean}  [params.canDelete]  include the delete action (default true)
 * @param {boolean}  [params.canExport]  include the export action (default true)
 * @returns {Array<object>} antd menu items
 */
export const buildManageMembersMenu = ({
  titleParams,
  onAdd,
  onAdvanceGrades,
  onExport,
  onDelete,
  canAdd = true,
  canAdvanceGrades = true,
  canExport = true,
  canDelete = true,
}) => {
  const label = String(titleParams || "").trim() || "member";
  const items = [];
  if (canAdd) {
    items.push({
      key: "add",
      label: `Add new ${label}`,
      icon: <Icon icon="tabler:user-plus" width={18} />,
      onClick: () => onAdd?.(),
    });
  }
  if (canAdd && (canAdvanceGrades || canExport || canDelete)) {
    items.push({ type: "divider" });
  }
  if (canAdvanceGrades) {
    items.push({
      key: "advance-grades",
      label: "Advance grades",
      icon: <Icon icon="tabler:player-track-next" width={18} />,
      onClick: () => onAdvanceGrades?.(),
    });
  }
  if (canAdvanceGrades && (canExport || canDelete)) {
    items.push({ type: "divider" });
  }
  if (canExport) {
    items.push({
      key: "export",
      label: `Export ${label} (.xlsx)`,
      icon: <Icon icon="tabler:file-spreadsheet" width={18} />,
      onClick: () => onExport?.(),
    });
  }
  if (canExport && canDelete) {
    items.push({ type: "divider" });
  }
  if (canDelete) {
    items.push({
      key: "delete",
      danger: true,
      label: `Delete ${label}`,
      icon: <Icon icon="tabler:trash" width={18} />,
      onClick: () => onDelete?.(),
    });
  }
  return items;
};
