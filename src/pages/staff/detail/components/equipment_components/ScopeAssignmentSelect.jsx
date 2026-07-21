import MultiSelectComponent from "../../../../../components/UX/dropdown/MultiSelectComponent";
import { getRoleScopeDimension } from "../../../../../config/roles";
import { useCompanyCategories } from "../../../../../hooks/useCompanyCategories";
import { useCompanyScopeLocations } from "../../../../../hooks/useCompanyScopeLocations";

/**
 * Scope-assignment control. Renders a Locations multi-select, a Categories
 * multi-select, or nothing, based on getRoleScopeDimension(roleType). Both
 * dimensions source options from the LIVE `db_company` endpoints and carry the
 * numeric id (location_id / category_id) as value — that id is what the scope
 * endpoint (§4) expects.
 *
 * `value` / `onChange` follow a plain array contract of numeric ids so callers
 * don't need to know about MultiSelectComponent's internal Set-based model.
 */
const ScopeAssignmentSelect = ({ roleType, value = [], onChange }) => {
  const dimension = getRoleScopeDimension(roleType);

  const categoriesQuery = useCompanyCategories();
  const locationsQuery = useCompanyScopeLocations();

  if (!dimension) return null;

  const sourceOptions =
    dimension === "location" ? locationsQuery.options : categoriesQuery.options;
  const items = sourceOptions.map((option) => ({
    id: option.value,
    label: option.label,
  }));

  const selectedKeys = new Set(value);
  const handleSelectionChange = (newSelection) => {
    onChange?.(Array.from(newSelection));
  };

  return (
    <MultiSelectComponent
      label={dimension === "location" ? "Assigned locations" : "Assigned categories"}
      placeholder={
        dimension === "location" ? "Select locations" : "Select categories"
      }
      items={items}
      selectedKeys={selectedKeys}
      onSelectionChange={handleSelectionChange}
      isRequired
      hint="At least one assignment is required — a scoped user with no assignments cannot see any inventory."
    />
  );
};

export default ScopeAssignmentSelect;
