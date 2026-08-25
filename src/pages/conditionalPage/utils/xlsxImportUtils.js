/* eslint-disable no-useless-escape */
/**
 * Pure logic for the XLSX bulk member import: header normalization, alias
 * resolution, and row validation/normalization. Kept out of the component so
 * it can be unit-tested without a spreadsheet.
 */

import { calculateStudentAgeFlags } from "./ageCalculationUtils";

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
  grade: ["grade", "grade_level", "year"],
  homeroom: ["homeroom", "home_room", "class", "classroom"],
  date_of_birth: ["date_of_birth", "dob", "birth_date", "birthday", "date of birth"],
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
  image_url: ["image_url", "imageurl", "photo", "photo_url", "picture"],
};

/**
 * The columns the downloadable template offers — the single source of truth for
 * the .xlsx template, the on-screen guide table, and the guide's tour steps.
 *
 * It exists because those three lived as three hand-maintained lists in
 * AddNewMember.jsx while the accepted-header map lived here, and they drifted:
 * `grade` and `homeroom` were importable for months but absent from the
 * template, so every school that used the template imported students with no
 * grade — the field OverdueDevicesTable filters by and AdvanceGrades operates
 * on. xlsxImportUtils.test.js now asserts both directions of that agreement.
 *
 * `header` is what lands in row 1 of the spreadsheet and MUST resolve through
 * headerAliasMap. Deliberately absent:
 * - `address`: built from street/city/state/zip; offering both invites two
 *   spellings of one address that disagree.
 * - `minor`: derived from date_of_birth. Still accepted as a header for older
 *   files, but asking for it alongside the DOB creates two sources of truth for
 *   the same fact, and the DOB wins silently.
 */
export const MEMBER_IMPORT_COLUMNS = [
  {
    header: "first_name",
    title: "First Name",
    width: 120,
    required: true,
    example: "John",
    description: "The member's first name.",
  },
  {
    header: "last_name",
    title: "Last Name",
    width: 120,
    required: true,
    example: "Doe",
    description: "The member's last name.",
  },
  {
    header: "email",
    title: "Email",
    width: 200,
    required: true,
    example: "john.doe@example.com",
    description: "The member's email address. One row per address.",
  },
  {
    header: "phone",
    title: "Phone",
    width: 150,
    required: true,
    example: "555-0123",
    description: "The member's phone number.",
  },
  {
    header: "external_id",
    title: "External ID",
    width: 140,
    example: "ED_123456",
    description:
      "Your own student/member number, if you keep one. Header `id` is still accepted for older files.",
  },
  {
    header: "date_of_birth",
    title: "Date of Birth",
    width: 120,
    example: "06-15-2010",
    description:
      "MM-DD-YYYY. This is what decides whether the member is a minor, and therefore whether notices go to a guardian instead of to them. Leave it out and the row is treated as an adult.",
  },
  {
    header: "grade",
    title: "Grade",
    width: 90,
    example: "7",
    description:
      "School grade/year. Used by the overdue-devices filter and the end-of-year grade advance.",
  },
  {
    header: "homeroom",
    title: "Homeroom",
    width: 130,
    example: "Rivera 7B",
    description: "Homeroom or class group.",
  },
  {
    header: "address_street",
    title: "Street",
    width: 200,
    example: "123 Main St",
    description: "Street address. Combined with city/state/zip on save.",
  },
  {
    header: "address_city",
    title: "City",
    width: 150,
    example: "New York",
    description: "City.",
  },
  {
    header: "address_state",
    title: "State",
    width: 100,
    example: "NY",
    description: "State or province.",
  },
  {
    header: "address_zip",
    title: "Zip Code",
    width: 100,
    example: "10001",
    description: "Postal code.",
  },
  {
    header: "image_url",
    title: "Image URL",
    width: 200,
    example: "",
    description:
      "Optional link to the member's photo. Leave blank if you don't have one.",
  },
  {
    header: "parent_guardian_first_name",
    title: "Guardian First Name",
    width: 150,
    requiredIfMinor: true,
    example: "Jane",
    description: "Required when the member is a minor.",
  },
  {
    header: "parent_guardian_last_name",
    title: "Guardian Last Name",
    width: 150,
    requiredIfMinor: true,
    example: "Doe",
    description: "Required when the member is a minor.",
  },
  {
    header: "parent_guardian_email",
    title: "Guardian Email",
    width: 200,
    requiredIfMinor: true,
    example: "jane.doe@example.com",
    description:
      "Required when the member is a minor — every notice about the member goes here, not to the member.",
  },
  {
    header: "parent_guardian_phone_number",
    title: "Guardian Phone",
    width: 150,
    requiredIfMinor: true,
    example: "555-0124",
    description: "Required when the member is a minor.",
  },
];

/** "(mandatory)" / "(mandatory if minor)" / "(optional)" for the guide steps. */
export const columnRequirementLabel = (column) => {
  if (column?.required) return "mandatory";
  if (column?.requiredIfMinor) return "mandatory if minor";
  return "optional";
};

/**
 * The one example row shipped inside the downloaded template, keyed by the
 * spreadsheet headers. Also what the on-screen guide table renders, so the two
 * can never show different examples.
 *
 * @returns {object}
 */
export const buildTemplateRow = () =>
  MEMBER_IMPORT_COLUMNS.reduce(
    (row, column) => ({ ...row, [column.header]: column.example }),
    {}
  );

/** Excel's day-zero. 1899-12-30, not 12-31, because of the 1900 leap-year bug. */
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const MS_PER_DAY = 86400000;

const pad = (value) => String(value).padStart(2, "0");
const toIsoDay = (year, month, day) => `${year}-${pad(month)}-${pad(day)}`;

/**
 * Normalizes whatever a spreadsheet put in the date-of-birth cell into
 * `YYYY-MM-DD`, or null when it cannot be read.
 *
 * This exists because `calculateAge` requires `typeof dob === "string"`, and a
 * cell Excel has formatted as a date is NOT a string: `sheet_to_json` hands back
 * the serial number (40344) or, with cellDates, a Date. Both fell straight
 * through to `age: null` → `minor: false`, and no warning fired either, because
 * the field looked populated. A minor imported as an adult is the bug that mails
 * a 15-year-old about their own lost laptop instead of their guardian — the exact
 * defect fixed twice already this month, arriving by a third route.
 *
 * Accepts, in order: a Date, an Excel serial, ISO `YYYY-MM-DD`, and the
 * `MM-DD-YYYY` the template documents (with `/` or `-`). `DD-MM-YYYY` is taken
 * only when the first number cannot be a month, which is a fact rather than a
 * guess; a genuinely ambiguous `06-07-2010` is read as the documented MM-DD.
 *
 * @param {string|number|Date} value
 * @returns {string|null} YYYY-MM-DD
 */
export const parseImportedDob = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : toIsoDay(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }

  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    const date = new Date(EXCEL_EPOCH_UTC + value * MS_PER_DAY);
    if (Number.isNaN(date.getTime())) return null;
    // Read back in UTC: the serial is a whole day count, so any local-timezone
    // conversion here could only move it off by one — the same off-by-one that
    // put lease due dates a day early.
    return toIsoDay(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate()
    );
  }

  const raw = `${value ?? ""}`.trim();
  if (!raw) return null;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
  if (iso) {
    const [, year, month, day] = iso.map(Number);
    return isRealDate(year, month, day) ? toIsoDay(year, month, day) : null;
  }

  const slashed = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(raw);
  if (slashed) {
    const [, first, second, year] = slashed.map(Number);
    // first > 12 can only be a day, so DD-MM-YYYY is a reading, not a guess.
    const [month, day] = first > 12 ? [second, first] : [first, second];
    return isRealDate(year, month, day) ? toIsoDay(year, month, day) : null;
  }

  return null;
};

/** Rejects 2026-02-31 and friends, which the Date constructor rolls forward. */
function isRealDate(year, month, day) {
  if (!year || !month || !day || month > 12 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

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
 * `warnings` are for rows that import fine but carry a risk worth naming —
 * errors stop nothing here, the caller decides. Kept separate from `errors` so
 * the UI can show them in different colours instead of one red wall.
 *
 * @param {Array<object>} inputRows rows from sheet_to_json
 * @param {number|string|null} companyId company id to stamp on every row
 * @returns {{ errors: string[], warnings: string[], columnsDetected: string[], rows: object[] }}
 */
export const validateAndNormalizeRows = (inputRows = [], companyId = null) => {
  const errors = [];
  const warnings = [];
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

    // Calculate minor from DOB; fall back to manual minor column for backward
    // compat. The raw cell is normalized first — see parseImportedDob: an Excel
    // date cell arrives as a serial number, and passing that straight to the age
    // calculator silently produced an adult.
    const rawDob = normalizedRow["date_of_birth"];
    const hasDobCell = `${rawDob ?? ""}`.trim() !== "";
    const dob = parseImportedDob(rawDob) || "";
    if (hasDobCell && !dob) {
      // An error, not a warning: whoever filled that cell meant to state an age,
      // and getting it wrong flips who receives every notice about the member.
      errors.push(
        `Row ${
          idx + 1
        }: date of birth "${rawDob}" could not be read. Use MM-DD-YYYY (e.g. 06-15-2010).`
      );
    }
    const { minor: calculatedMinor, under_13 } = calculateStudentAgeFlags(dob);
    const manualMinor = /true|1|yes/i.test(String(normalizedRow.minor));
    const isMinor = dob ? calculatedMinor : manualMinor;
    const isUnder13 = dob ? under_13 : false;

    // With neither a DOB nor a minor column there is nothing to derive an age
    // from, and the row lands as an ADULT. For a school that is the bug that
    // mails a 15-year-old about their own lost laptop instead of their guardian.
    // Not an error — a non-school company imports adults legitimately — but it
    // has to be said out loud rather than assumed.
    const hasMinorColumn = Object.prototype.hasOwnProperty.call(
      normalizedRow,
      "minor"
    );
    if (!dob && !hasMinorColumn) {
      warnings.push(
        `Row ${
          idx + 1
        }: no date of birth and no minor column — imported as an ADULT, so notices will go to them and not to a guardian.`
      );
    }

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
      image_url: normalizedRow.image_url || "",
      grade: String(normalizedRow.grade || ""),
      homeroom: String(normalizedRow.homeroom || ""),
      date_of_birth: dob,
      minor: isMinor,
      under_13: isUnder13,
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
    warnings,
    columnsDetected: Array.from(detectedSet),
    rows,
  };
};
