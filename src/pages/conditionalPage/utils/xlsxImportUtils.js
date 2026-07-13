/* eslint-disable no-useless-escape */
/**
 * Pure logic for the XLSX bulk member import: header normalization, alias
 * resolution, and row validation/normalization. Kept out of the component so
 * it can be unit-tested without a spreadsheet.
 */

/** Normalizes an arbitrary header name to a snake_case token. */
export const normalizeHeader = (key) =>
  String(key || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

/** Maps normalized header variants to the target schema keys. */
export const headerAliasMap = {
  "first name": ["first_name", "firstname", "first"],
  "last name": ["last_name", "lastname", "last"],
  email: ["email", "e_mail"],
  phone: ["phone", "phone_number", "phonenumber", "mobile"],
  "external id": ["external_id", "external id", "id"],
  address: ["address", "addr"],
  street: ["address_street", "street", "addr_street", "addres_street"],
  city: ["address_city", "city", "addr_city"],
  state: ["address_state", "state", "addr_state", "province"],
  zip: ["address_zip", "zip", "zip_code", "zipcode", "postal_code"],
  minor: ["minor", "is_minor"],
  "parent guardian first name": [
    "parent_guardian_first_name",
    "guardian_first_name",
  ],
  "parent guardian last name": [
    "parent_guardian_last_name",
    "guardian_last_name",
  ],
  "parent guardian email": ["parent_guardian_email", "guardian_email"],
  "parent guardian phone number": [
    "parent_guardian_phone_number",
    "guardian_phone",
  ],
};

/** Resolves a normalized header token to its canonical target key, or null. */
export const resolveKey = (normalizedKey) => {
  for (const target in headerAliasMap) {
    if (headerAliasMap[target].includes(normalizedKey)) return target;
  }
  return null;
};

const REQUIRED_CORE = ["first name", "last name", "email", "phone"];

/**
 * Validates and normalizes raw spreadsheet rows into the member schema.
 *
 * @param {Array<object>} inputRows rows from sheet_to_json
 * @param {number|string|null} companyId company id to stamp on every row
 * @returns {{ errors: string[], columnsDetected: string[], rows: object[] }}
 */
export const validateAndNormalizeRows = (inputRows = [], companyId = null) => {
  const errors = [];
  const rows = [];
  const detectedSet = new Set();

  inputRows.forEach((row, idx) => {
    const normalizedRow = {};

    Object.entries(row).forEach(([k, v]) => {
      const target = resolveKey(normalizeHeader(k));
      if (target) {
        normalizedRow[target] = v;
        detectedSet.add(target);
      }
    });

    const missingCore = REQUIRED_CORE.filter((k) => !normalizedRow[k]);
    if (missingCore.length) {
      errors.push(
        `Row ${idx + 1}: missing required field(s): ${missingCore.join(", ")}`
      );
    }

    const isMinor = /true|1|yes/i.test(String(normalizedRow.minor));
    if (isMinor) {
      if (!normalizedRow["parent guardian first name"])
        errors.push(`Row ${idx + 1}: Guardian first name is required for minors.`);
      if (!normalizedRow["parent guardian last name"])
        errors.push(`Row ${idx + 1}: Guardian last name is required for minors.`);
      if (!normalizedRow["parent guardian email"])
        errors.push(`Row ${idx + 1}: Guardian email is required for minors.`);
      if (!normalizedRow["parent guardian phone number"])
        errors.push(
          `Row ${idx + 1}: Guardian phone number is required for minors.`
        );
    }

    const hasParts = ["street", "city", "state", "zip"].every((k) =>
      Boolean(normalizedRow[k])
    );

    rows.push({
      first_name: normalizedRow["first name"] || "",
      last_name: normalizedRow["last name"] || "",
      email: normalizedRow.email || "",
      phone: normalizedRow.phone || "",
      external_id: String(normalizedRow["external id"] || ""),
      address:
        normalizedRow.address ||
        (hasParts
          ? `${normalizedRow.street}, ${normalizedRow.city}, ${normalizedRow.state} ${normalizedRow.zip}`
          : ""),
      address_street: normalizedRow.street || "",
      address_city: normalizedRow.city || "",
      address_state: normalizedRow.state || "",
      address_zip: normalizedRow.zip || "",
      company_id: companyId,
      minor: isMinor,
      parent_guardian_first_name:
        normalizedRow["parent guardian first name"] || "",
      parent_guardian_last_name:
        normalizedRow["parent guardian last name"] || "",
      parent_guardian_email: normalizedRow["parent guardian email"] || "",
      parent_guardian_phone_number:
        normalizedRow["parent guardian phone number"] || "",
    });
  });

  return {
    errors,
    columnsDetected: Array.from(detectedSet),
    rows,
  };
};
