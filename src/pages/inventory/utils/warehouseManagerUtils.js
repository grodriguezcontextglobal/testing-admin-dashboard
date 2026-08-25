import { getRoleLabelGroupKey } from "../../../config/roles";

/** The role concept that counts as being in charge of the warehouse. */
const WAREHOUSE_MANAGER_CONCEPT = "inventory_manager";

/**
 * Mirrors the active-staff predicate the staff KPI strip uses: `active` arrives
 * as a boolean, "active", or "true" depending on the path, and a "Pending"
 * invitation is not yet a person you can point at.
 */
const isActiveEmployee = (employee) => {
  if (employee?.status === "Pending") return false;
  const active = employee?.active;
  return (
    active === true ||
    String(active).toLowerCase() === "active" ||
    String(active).toLowerCase() === "true"
  );
};

const fullName = (employee) =>
  [employee?.firstName, employee?.lastName].filter(Boolean).join(" ").trim();

/**
 * Returns the single employee to credit as warehouse manager, or null.
 *
 * Matched by role CONCEPT rather than a literal, so it works whether the
 * employee record stores the legacy numeric role ("4"), the legacy string
 * ("inventory_manager") or the canonical F-01 string ("manager_inventory") —
 * getRoleLabelGroupKey collapses all three. Comparing against a literal is how
 * the KPI donut ended up bucketing string roles as NaN.
 *
 * Deliberately excludes inactive and still-Pending staff: naming someone who
 * no longer works there as the person in charge is worse than showing nobody.
 *
 * Only one is returned, per product decision, picked at random when a company
 * has several. Note the consequence: the name is not stable across reloads, so
 * two people looking at the same company can see different managers. The
 * caller memoises it, which keeps it fixed for the life of the mount — switch
 * this to a sort if the pill should ever be reproducible.
 *
 * Scoped location managers (inventory_location_manager) are NOT matched: they
 * are in charge of specific locations, not the warehouse as a whole. Add that
 * concept here if the pill should ever cover them.
 *
 * @param {Array<object>} employees company.employees
 * @returns {{name: string, email: string|undefined}|null}
 */
export const findWarehouseManager = (employees) => {
  const list = Array.isArray(employees) ? employees : [];

  const managers = list
    .filter(isActiveEmployee)
    .filter((employee) => {
      const raw = employee?.roleType || employee?.role;
      // Screen blanks before resolving: Number("") and Number(null) are 0, and
      // 0 maps to root_admin, so an employee with an empty role would resolve
      // to a concept they do not hold.
      if (raw === undefined || raw === null || raw === "") return false;
      return getRoleLabelGroupKey(raw) === WAREHOUSE_MANAGER_CONCEPT;
    })
    .filter((employee) => fullName(employee).length > 0);

  if (managers.length === 0) return null;
  const picked = managers[Math.floor(Math.random() * managers.length)];
  return { name: fullName(picked), email: picked?.user };
};

export default findWarehouseManager;
