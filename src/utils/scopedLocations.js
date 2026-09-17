/**
 * Which locations a staff member's role is scoped to, reading the two stores
 * that hold that answer in the order that makes them agree.
 *
 * There are two, and this is R3. The scope-assignment screen
 * (`UpdateRoleInCompany`) writes locations to **SQL** through
 * `PUT /db_staff/company-staff/scope`, and they come back at login inside
 * `/db_staff/companies` → `state.permission.locations`, shaped
 * `{location_id, location_name, can_create, can_update, can_delete}`. The older
 * screen (`AssignLocationManager`) writes **Mongo**
 * `employee.preference.managerLocation`, which is what `useStaffRoleAndLocations`
 * reads and what every location check on /inventory was built on.
 *
 * Nothing wrote both, so a role scoped through the new screen reached the
 * inventory page with an empty legacy array — read there as "this person has no
 * location restrictions", which showed them the whole company's inventory.
 *
 * SQL wins when both hold something, because SQL is what the server enforces
 * inside `inventory-page`: a client that preferred the other copy would filter
 * by one rule while the server filtered by another, and the difference would
 * show up as rows that flicker in and out depending on who answered.
 *
 * The legacy array stays as the fallback because nobody has migrated the
 * records the old screen wrote. Dropping it would unscope every staff member
 * assigned before the new screen existed.
 *
 * @param {{sqlLocations?: Array<{location_name?: string}>,
 *   legacyLocationNames?: string[]}} params
 * @returns {string[]} location names, empty when neither store says anything
 */
export const resolveScopedLocationNames = ({
  sqlLocations,
  legacyLocationNames,
} = {}) => {
  const fromSql = Array.isArray(sqlLocations)
    ? sqlLocations
        .map((location) => location?.location_name)
        .filter((name) => typeof name === "string" && name !== "")
    : [];

  if (fromSql.length > 0) return fromSql;

  return Array.isArray(legacyLocationNames)
    ? legacyLocationNames.filter((name) => typeof name === "string" && name !== "")
    : [];
};
