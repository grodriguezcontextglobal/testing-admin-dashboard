import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import MultiSelectComponent from "../../../../../components/UX/dropdown/MultiSelectComponent";
import { getRoleScopeDimension } from "../../../../../config/roles";
import { useCompanyCategories } from "../../../../../hooks/useCompanyCategories";

/**
 * Scope-assignment scaffold (Phase A — FRONTEND_scoped_roles_phaseA_plan.md
 * §4.2). Renders a Locations multi-select, a Categories multi-select, or
 * nothing, based on getRoleScopeDimension(roleType). NOT wired to save —
 * consumers (UpdateRoleInCompany.jsx) block the actual save call until
 * Phase B (backend scope endpoint §5.4 doesn't exist yet).
 *
 * `value` / `onChange` follow a plain string[] contract (location names or
 * category names) so callers don't need to know about MultiSelectComponent's
 * internal Set-based selection model.
 */
const ScopeAssignmentSelect = ({ roleType, value = [], onChange }) => {
  const dimension = getRoleScopeDimension(roleType);
  const { user } = useSelector((state) => state.admin);

  // Reuses the same company-locations query AssignLocation/AssignLocationManager
  // use — no shared hook exists yet for it, so the query is replicated here
  // rather than importing component-local logic from those flows (R3: do not
  // build a third location-permission path; this only reads location names).
  const locationsQuery = useQuery({
    queryKey: ["companyLocationsListQuery", user?.sqlInfo?.company_id],
    queryFn: () =>
      devitrakApi.post(
        `/db_location/companies/${user.sqlInfo.company_id}/locations`,
        {
          company_id: user.sqlInfo.company_id,
          preference:
            user?.companyData?.employees?.find((emp) => emp.user === user.email)
              ?.preference || [],
        }
      ),
    enabled: dimension === "location" && !!user?.sqlInfo?.company_id,
  });

  const categoriesQuery = useCompanyCategories();

  if (!dimension) return null;

  const locationOptions = locationsQuery.data?.data?.data
    ? Object.keys(locationsQuery.data.data.data).map((loc) => ({
        id: loc,
        label: loc,
      }))
    : [];

  const items = dimension === "location" ? locationOptions : categoriesQuery.options.map(
    (option) => ({ id: option.value, label: option.label })
  );

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
