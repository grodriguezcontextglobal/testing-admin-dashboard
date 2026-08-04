/**
 * Canonical ownership values used across the app (see the manual "Add new
 * item" dropdown in AddNewItem.jsx): "Permanent", "Rent", "Sale". That
 * dropdown deliberately restricts staff to only those 3 values. Bulk XLSX
 * imports have no such guardrail — the column is free text chosen by
 * whoever fills out the spreadsheet, without visibility into what the
 * system expects — so every recognized synonym is mapped into one of the
 * 3 canonical buckets here rather than passed through as a custom value,
 * to avoid a backend error or a stray value showing up in inventory tables.
 */
const OWNERSHIP_SYNONYMS = {
  permanent: "Permanent",
  owned: "Permanent",
  own: "Permanent",
  purchased: "Permanent",
  purchase: "Permanent",
  donated: "Permanent",
  donation: "Permanent",
  rent: "Rent",
  rental: "Rent",
  rented: "Rent",
  lease: "Rent",
  leased: "Rent",
  loaner: "Rent",
  loan: "Rent",
  loaned: "Rent",
  trial: "Rent",
  demo: "Rent",
  sale: "Sale",
  sold: "Sale",
  "for sale": "Sale",
  consignment: "Sale",
};

/**
 * Maps a free-text ownership value (e.g. from an XLSX column) to its
 * canonical form. Unrecognized values are returned trimmed but otherwise
 * unchanged, so a genuinely new/unexpected value stays visible instead of
 * being silently coerced or dropped.
 *
 * @param {string|null|undefined} value
 * @returns {string}
 */
export function normalizeOwnership(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  return OWNERSHIP_SYNONYMS[trimmed.toLowerCase()] ?? trimmed;
}
