/**
 * Pure helpers for the staff admin table (MainAdminSettingPage).
 * Kept out of the component so they can be unit-tested and memoized cheaply.
 */

/**
 * Maps enriched employee records to the row shape consumed by the table,
 * precomputing a lowercase `_haystack` so the search filter never has to
 * JSON.stringify a row again per keystroke.
 *
 * @param {Array<object>} employees enriched employee records
 * @returns {Array<object>} table rows
 */
export const buildStaffRows = (employees) => {
  if (!Array.isArray(employees)) return [];
  return employees.map((data) => ({
    name: `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim(),
    email: data.email,
    phone: data.phone,
    role: data.role,
    active: data.status,
    entireData: data,
    key: data.email,
    _haystack: JSON.stringify(data).toLowerCase(),
  }));
};

/**
 * Case-insensitive substring filter over the precomputed row haystack.
 * An empty/whitespace term returns every row.
 *
 * @param {Array<object>} rows rows produced by buildStaffRows
 * @param {string} searchTerm raw search input
 * @returns {Array<object>} filtered rows
 */
export const filterStaffRows = (rows, searchTerm) => {
  const term = `${searchTerm ?? ""}`.trim().toLowerCase();
  if (!term) return rows;
  return rows.filter((row) => row._haystack.includes(term));
};
