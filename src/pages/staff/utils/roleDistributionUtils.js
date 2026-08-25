import { getRoleLabelGroupKey, ROLE_LEVELS } from "../../../config/roles";

/**
 * Builds the slices for the staff page's role-distribution donut.
 *
 * Groups by role CONCEPT rather than by a numeric role value. Keying off
 * `Number(member.role)` assumed every role is a legacy numeric level, but
 * scoped roles (category_manager, inventory_location_manager, …) are stored
 * as strings — UpdateRoleInCompany writes `role: roleType` for them — so
 * Number() turned every one of them into NaN. They collapsed into a single
 * slice literally labelled "NaN", counting unrelated roles together, and
 * ROLE_COLORS[NaN] left it with no color.
 *
 * getRoleLabelGroupKey accepts both shapes, and keying on the concept also
 * merges the legacy and canonical spellings of one role (role "1" and
 * roleType "admin") into one slice instead of two.
 *
 * Slices come back most- to least-privileged. The scoped roles deliberately
 * have no ROLE_LEVELS entry (see the R1 note in config/roles.js), so the 99
 * default puts them after the ranked ones.
 *
 * Members with no resolvable role are skipped rather than bucketed together:
 * the donut describes a distribution, and the headline staff count is its own
 * tile, so an "undefined" wedge would only be noise.
 *
 * @param {Array<{role?: string|number, roleType?: string}>} employees
 * @param {(roleType: string) => string} roleLabel from useRoleLabel(), so the
 *   company's own renamed labels win over the built-in ones.
 * @param {string[]} colors palette, applied by slice position.
 * @returns {Array<{name: string, value: number, itemStyle: {color: string|undefined}}>}
 */
export const buildRoleDistribution = (employees, roleLabel, colors = []) => {
  const list = Array.isArray(employees) ? employees : [];

  const counts = list.reduce((acc, member) => {
    const raw = member?.roleType || member?.role;
    // Screen out blanks BEFORE getRoleLabelGroupKey. It starts with
    // LEGACY_ROLE_MAP[Number(roleType)], and Number("") and Number(null) are
    // both 0 — so an employee with an empty role would be counted as
    // root_admin, the most privileged label on the chart.
    if (raw === undefined || raw === null || raw === "") return acc;
    const key = getRoleLabelGroupKey(raw);
    if (key === undefined || key === null || key === "") return acc;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort(([a], [b]) => {
      const byLevel = (ROLE_LEVELS[a] ?? 99) - (ROLE_LEVELS[b] ?? 99);
      // The scoped roles all share the 99 default, so fall back to the key to
      // keep the wedge order stable instead of dependent on roster order.
      return byLevel !== 0 ? byLevel : String(a).localeCompare(String(b));
    })
    .map(([key, value], index) => ({
      // String(key) only guards against a roleType with no label at all; it
      // keeps the wedge readable instead of rendering an empty legend row.
      name: roleLabel?.(key) || String(key),
      value,
      itemStyle: {
        color: colors.length ? colors[index % colors.length] : undefined,
      },
    }));
};

export default buildRoleDistribution;
