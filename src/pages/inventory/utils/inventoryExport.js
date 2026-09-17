/**
 * The inventory the XLSX export needs, fetched when someone asks for it.
 *
 * With the server paginating, the table holds ten rows — so the export, which
 * read the table's dataset, produced a spreadsheet of ten rows or none at all.
 *
 * It does **not** walk `inventory-page`. That endpoint returns thirteen
 * columns, and the spreadsheet has sixteen: `cost`, `descript_item`,
 * `extra_serial_number`, `return_date` and `event_name` are not among the
 * thirteen, so an export built from pages would quietly drop the replacement
 * cost and the description. `warehouse-items` still returns the whole row, so
 * the export asks that, once, on the click.
 *
 * Downloading the whole inventory is what an export *is*. What the migration
 * removed was paying for it on every page load — three times, before the user
 * asked for anything.
 */

/**
 * @param {{companyId: number|string, role: unknown, locations?: string[]|null,
 *   fallbackPreference?: unknown}} params
 * @returns {{company_id: unknown, role: unknown, preference: unknown}} the same
 *   body the table sent for years; `preference` keeps its fallback because an
 *   empty array reads as "scoped to zero locations", not "unscoped"
 */
export const buildInventoryExportBody = ({
  companyId,
  role,
  locations,
  fallbackPreference,
}) => ({
  company_id: companyId,
  role,
  preference:
    Array.isArray(locations) && locations.length > 0
      ? locations
      : fallbackPreference,
});

/**
 * @param {{post: Function}} api the devitrak client
 * @param {object} body from buildInventoryExportBody
 * @returns {Promise<Array>} every row, or none — a failure is thrown on so the
 *   caller can say the export failed instead of writing an empty file
 */
export const fetchInventoryForExport = async (api, body) => {
  const response = await api.post("/db_item/warehouse-items", body);
  const items = response?.data?.items;
  return Array.isArray(items) ? items : [];
};
