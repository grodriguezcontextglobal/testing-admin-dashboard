/**
 * Pure helpers for the DeleteMember table.
 * Kept out of the component so they can be unit-tested and memoized cheaply.
 */

/** Joins the address parts, skipping any that are empty. */
const composeAddress = (m) => {
  if (m.address) return m.address;
  const street = m.address_street ?? "";
  const parts = [
    m.address_city,
    m.address_state,
    [m.address_zip ?? m.address_zip_code].filter(Boolean).join(""),
  ].filter(Boolean);
  return [street, parts.join(", ")].filter(Boolean).join(", ").trim();
};

/**
 * Maps member records to the row shape consumed by the delete table,
 * precomputing a lowercase `_haystack` so the search filter never has to
 * JSON.stringify a row again per keystroke.
 *
 * @param {Array<object>} members raw member records
 * @returns {Array<object>} table rows keyed by member_id
 */
export const buildMemberRows = (members) => {
  if (!Array.isArray(members)) return [];
  return members.map((m) => ({
    name: `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim(),
    email: m.email,
    phone: m.phone_number ?? m.phone,
    address: composeAddress(m),
    member_id: m.member_id,
    entireData: m,
    key: m.member_id,
    _haystack: JSON.stringify(m).toLowerCase(),
  }));
};

/**
 * Case-insensitive substring filter over the precomputed row haystack.
 * An empty/whitespace term returns every row.
 *
 * @param {Array<object>} rows rows produced by buildMemberRows
 * @param {string} searchTerm raw search input
 * @returns {Array<object>} filtered rows
 */
export const filterMemberRows = (rows, searchTerm) => {
  const term = `${searchTerm ?? ""}`.trim().toLowerCase();
  if (!term) return rows;
  return rows.filter((row) => row._haystack.includes(term));
};
