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
 * @returns {Array<object>} antd menu items
 */
export const buildManageMembersMenu = ({ titleParams, onAdd, onDelete }) => {
  const label = String(titleParams || "").trim() || "member";
  return [
    {
      key: "add",
      label: `Add new ${label}`,
      icon: <Icon icon="tabler:user-plus" width={18} />,
      onClick: () => onAdd?.(),
    },
    { type: "divider" },
    {
      key: "delete",
      danger: true,
      label: `Delete ${label}`,
      icon: <Icon icon="tabler:trash" width={18} />,
      onClick: () => onDelete?.(),
    },
  ];
};
