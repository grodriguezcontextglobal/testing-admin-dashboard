import { Icon } from "@iconify/react";

/**
 * Builds the antd Dropdown items for the "Manage members" control on the
 * members list page. Mirrors the staff MainPage "Manage staff" menu: an add
 * action, a divider, and a danger delete action.
 *
 * @param {object}   params
 * @param {string}   params.titleParams  singular/plural label (e.g. "members")
 * @param {Function} [params.onAdd]      handler for the add action
 * @param {Function} [params.onDelete]   handler for the delete action
 * @param {boolean}  [params.canAdd]     include the add action (default true)
 * @param {boolean}  [params.canDelete]  include the delete action (default true)
 * @returns {Array<object>} antd menu items
 */
export const buildManageMembersMenu = ({
  titleParams,
  onAdd,
  onDelete,
  canAdd = true,
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
  if (canAdd && canDelete) {
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
