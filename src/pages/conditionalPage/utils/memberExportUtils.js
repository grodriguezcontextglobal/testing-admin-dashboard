/**
 * Pure row-builders for the members/member-detail .xlsx exports. Kept
 * free of the `xlsx` package itself so they're cheap to unit test — the
 * workbook/writeFile glue lives in the component that triggers the export
 * (same split as the existing SpreadSheet.jsx exporter).
 */

/** Column order + header labels shared by the members-list sheet and the
 * single-member "Profile" sheet (transposed into field/value pairs there). */
export const MEMBERS_EXPORT_COLUMNS = [
  { key: "member_id", label: "Member ID" },
  { key: "first_name", label: "First name" },
  { key: "last_name", label: "Last name" },
  { key: "email", label: "Email" },
  { key: "phone_number", label: "Phone" },
  { key: "address_street", label: "Street" },
  { key: "address_city", label: "City" },
  { key: "address_state", label: "State" },
  { key: "address_zip", label: "Zip" },
  { key: "grade", label: "Grade" },
  { key: "homeroom", label: "Homeroom" },
  { key: "minor", label: "Minor" },
  { key: "date_of_birth", label: "Date of birth" },
  { key: "guardian_first_name", label: "Guardian first name" },
  { key: "guardian_last_name", label: "Guardian last name" },
  { key: "guardian_email", label: "Guardian email" },
  { key: "guardian_phone_number", label: "Guardian phone" },
];

export const ASSIGNED_DEVICES_EXPORT_COLUMNS = [
  { key: "device_serial_number", label: "Serial number" },
  { key: "device_item_group", label: "Device type" },
  { key: "device_category_name", label: "Device name" },
  { key: "assigned_date", label: "Assigned date" },
  { key: "expected_return_date", label: "Expected return date" },
];

/**
 * Maps raw member records (from /db_member/consulting-member) to flat
 * export rows keyed by MEMBERS_EXPORT_COLUMNS — every field, not just
 * what the on-screen table shows.
 *
 * @param {Array<object>} members
 * @returns {Array<object>}
 */
export function buildMembersExportRows(members) {
  if (!Array.isArray(members)) return [];
  return members.map((m) => ({
    member_id: m?.member_id ?? "",
    first_name: m?.first_name ?? "",
    last_name: m?.last_name ?? "",
    email: m?.email ?? "",
    phone_number: m?.phone_number ?? "",
    address_street: m?.address_street ?? "",
    address_city: m?.address_city ?? "",
    address_state: m?.address_state ?? "",
    address_zip: m?.address_zip ?? "",
    grade: m?.grade ?? "",
    homeroom: m?.homeroom ?? "",
    minor: Number(m?.minor) === 1 ? "Yes" : "No",
    date_of_birth: m?.date_of_birth ?? "",
    guardian_first_name: m?.parent_guardian_first_name ?? "",
    guardian_last_name: m?.parent_guardian_last_name ?? "",
    guardian_email: m?.parent_guardian_email ?? "",
    guardian_phone_number: m?.parent_guardian_phone_number ?? "",
  }));
}

/**
 * Transposes a single member's export row into field/value pairs — more
 * readable than a 1-row table for a single-record "Profile" sheet.
 *
 * @param {object|null|undefined} member
 * @returns {Array<{field: string, value: *}>}
 */
export function buildMemberProfileExportPairs(member) {
  if (!member) return [];
  const [row] = buildMembersExportRows([member]);
  return MEMBERS_EXPORT_COLUMNS.map(({ key, label }) => ({
    field: label,
    value: row[key],
  }));
}

/**
 * Maps raw assigned-device rows (from
 * /db_member/retrieve-members-assigned-devices) to flat export rows keyed
 * by ASSIGNED_DEVICES_EXPORT_COLUMNS.
 *
 * @param {Array<object>} devices
 * @returns {Array<object>}
 */
export function buildAssignedDevicesExportRows(devices) {
  if (!Array.isArray(devices)) return [];
  return devices.map((d) => ({
    device_serial_number: d?.device_serial_number ?? "",
    device_item_group: d?.device_item_group ?? "",
    device_category_name: d?.device_category_name ?? "",
    assigned_date: d?.assigned_date ?? "",
    expected_return_date: d?.expected_return_date ?? "",
  }));
}
