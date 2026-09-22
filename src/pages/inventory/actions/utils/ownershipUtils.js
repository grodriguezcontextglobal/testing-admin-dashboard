/**
 * Canonical ownership values used across the app: **"Permanent"**, **"Rent"**,
 * **"Resale"**.
 *
 * It was "Sale" here and "Resale" in half the forms. `AddNewItem`,
 * `SingleItemFields` and the consumer assignment wrote "Sale"; `NewBulkItems`,
 * `EditGroup` and `EditItemModal` wrote "Resale"; the XLSX import wrote "Sale".
 * Five display dictionaries then papered over it by mapping both to the same
 * words — and disagreeing on which words: the main table said "For sale", the
 * filters said "For resale", the export said "For Resale".
 *
 * The split was invisible until it was not. The inventory table offered **Sale
 * and Resale as two separate filters**, so filtering by one hid every row
 * written by the other half of the app.
 *
 * "Resale" wins because it is what the value means — stock bought to sell on —
 * and "Sale" reads like a transaction that already happened. `sale` and its
 * synonyms stay accepted and map here, so rows already stored that way keep
 * working; nothing has to be migrated.
 *
 * Bulk XLSX imports have no dropdown to restrict them — the column is free text
 * chosen by whoever fills the spreadsheet in — so every recognized synonym is
 * mapped into one of the three buckets rather than passed through, to keep a
 * stray value out of the inventory tables.
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
  resale: "Resale",
  "for resale": "Resale",
  sale: "Resale",
  sold: "Resale",
  "for sale": "Resale",
  consignment: "Resale",
};

/** The three, in the order every dropdown offers them. */
export const OWNERSHIP_VALUES = ["Permanent", "Rent", "Resale"];

/**
 * How each value reads to a person.
 *
 * One dictionary instead of the five that had drifted apart. "Sale" is still a
 * key: rows written before the values were reconciled are still in the
 * database, and they read as what they are.
 */
export const OWNERSHIP_LABELS = {
  Permanent: "Permanent",
  Rent: "Leased",
  Resale: "Resale",
  Sale: "Resale",
};

/** What to show for a stored value, falling back to the value itself. */
export const ownershipLabel = (value) =>
  OWNERSHIP_LABELS[normalizeOwnership(value)] ??
  OWNERSHIP_LABELS[value] ??
  String(value ?? "");

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
