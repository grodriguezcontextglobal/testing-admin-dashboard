/**
 * The one description of the inventory XLSX import.
 *
 * Three things have to agree for an import to work: the guide table in the
 * tour, the spreadsheet "Download Template" hands out, and the header aliases
 * the parser matches on. They were three separate lists and they had drifted:
 * the template still shipped a Company column that had already been removed
 * from the guide (and that the parser never read, because company comes from
 * the session), while four columns the parser *does* read — Assignable,
 * Container, Container Capacity, Stored in container? — appeared in none of
 * them, so there was no way to set them from a spreadsheet at all. Assignable
 * was the costly one: every imported unit landed with enableAssignFeature = 0,
 * which is inventory nobody can hand out.
 *
 * Status went the other way. It was documented as mandatory with a default of
 * "Operational", and the parser never read it — no creation path in the app
 * sends `status`, the backend fills it. Documenting a column that is discarded
 * is worse than not documenting it, so it is gone.
 *
 * Everything here is plain data on purpose: it is the only part of the import
 * that can be unit-tested, and the drift above is exactly what the tests pin.
 */

/**
 * A row is skipped by the parser when any of these is blank. This list is the
 * contract, not a wish: it has to match the check in DocumentInventoryXLSXUpload,
 * or the guide promises a rejection that never happens (or worse, hides one that
 * does).
 */
export const REQUIRED_IMPORT_FIELDS = [
  "category_name",
  "item_group",
  "serial_number",
  "cost",
  "brand",
  "ownership",
  "main_warehouse",
  "location",

];

/**
 * Not required, but worth insisting on: the import succeeds without them and
 * lands a device with no brand, a cost of 0 or no ownership, which then has to
 * be corrected one unit at a time. That is a different thing from the optional
 * columns, where the default is genuinely fine — so the guide gives it its own
 * tier rather than flattening both into "Optional".
 */
export const RECOMMENDED_IMPORT_FIELDS = [
  "sub_location",
  "extra_serial_number",
  "image_url",
];

/**
 * Header normalization, matching what the parser does to each key it finds in
 * the sheet: forgive surrounding space, a trailing mandatory asterisk, and
 * casing. Nothing beyond that.
 *
 * This is tolerance for Excel, not an alias. A header that arrives as
 * `" Serial Number* "` is the same column; one that arrives as `"Serial No"`
 * is not, and saying so is the whole point of the change.
 */
export const normalizeHeader = (value) =>
  String(value ?? "")
    .trim()
    .replace("*", "")
    .toLowerCase();

/**
 * Column order here is the column order of the generated spreadsheet, grouped
 * the way someone fills one in: what the device is, what it costs, where it
 * lives, how it may be handed out, then the optional extras.
 *
 * `header` is the only spelling the parser accepts. It used to carry an
 * `aliases` list — `item_group` answered to "Device Name", "device name",
 * "device_name" and "Group" — and that is gone:
 *
 * > P2 `5:22` — "just accept the columns for what they are. This is the way you
 * > have to put it in. And the only thing we need to do is to describe what the
 * > column is and then tell them do not change the column names."
 * >
 * > P2 `5:51` — "delete for every single column here, also accepted as, all
 * > that, take it away."
 *
 * `defaultNote` is gone for the same kind of reason — the asterisk already says
 * which columns cannot be blank:
 *
 * > P2 `7:49` — "you don't have to say default empty… The ones that cannot be
 * > left empty are the one that you have the asterisk next by. Everybody
 * > understands that."
 */
export const INVENTORY_IMPORT_COLUMNS = [
  {
    header: "Category",
    field: "category_name",
    required: true,
    width: 150,
    notes: ["The family the device belongs to, e.g. 'Audio', 'Interpretation'."],
    samples: ["Audio", "Interpretation", "Fitness"],
  },
  {
    header: "Group",
    field: "item_group",
    required: true,
    width: 180,
    notes: [
      "The group name every unit of this model shares, e.g. 'PL6 RF Receiver'.",
      "Rows sharing a Category and a Device Name are imported as one group.",
    ],
    samples: ["Audio Device 1", "PL6 RF Receiver", "C4 Pre Workout"],
  },
  {
    header: "Serial Number",
    field: "serial_number",
    required: true,
    width: 150,
    notes: ["Unique per unit. One row per physical device."],
    samples: ["100001", "100002", "100003"],
  },
  {
    header: "Cost",
    field: "cost",
    required: true,
    width: 100,
    notes: ["Replacement cost, as a number. Both 45.5 and 45,5 are accepted."],
    samples: ["45.5", "99.0", "25.75"],
  },
  {
    header: "Brand",
    field: "brand",
    required: true,
    width: 120,
    notes: ["Manufacturer, e.g. 'Sony', 'Apple'."],
    samples: ["Sony", "Congress Audio", "Cellucor"],
  },
  {
    header: "Description",
    field: "descript_item",
    required: false,
    width: 200,
    notes: ["Free text."],
    samples: [
      "Audio Device 1 used for events and rentals",
      "Receiver used for interpretation events 70-75 MHz",
      "Pre workout supplement for fitness events",
    ],
  },
  {
    header: "Ownership",
    field: "ownership",
    required: true,
    width: 120,
    notes: [
      "Stored as one of: Permanent, Rent, Sale.",
      "Common synonyms are mapped for you — Owned, Purchased and Donated become Permanent; Rental, Leased and Loaned become Rent; Sold and Consignment become Sale.",
    ],
    samples: ["Rent", "Permanent", "Rent"],
  },
  {
    header: "Taxable Location",
    field: "main_warehouse",
    required: true,
    width: 160,
    notes: ["Where the device is deductible for taxes, e.g. 'Miami, FL'."],
    samples: ["Miami, FL", "Fort Lauderdale, FL", "Miami, FL"],
  },
  // {
  //   header: "Warehouse",
  //   field: "warehouse",
  //   required: false,
  //   width: 120,
  //   aliases: ["Warehouse", "warehouse"],
  //   notes: ["Is the unit in stock right now? Yes or No."],
  //   defaultNote: "Default: No",
  //   samples: ["Yes", "No", "Yes"],
  // },
  {
    header: "Location",
    field: "location",
    required: true,
    width: 150,
    notes: [
      "Where the unit physically sits, e.g. 'Miami, FL'.",
      "A location that does not exist yet is created during the import.",
    ],
    samples: ["Miami, FL", "Orlando, FL", "Miami, FL"],
  },
  {
    header: "Sub Locations",
    field: "sub_location",
    recommended: true,
    width: 180,
    notes: [
      "Comma-separated path inside the location, outermost first.",
      "e.g. 'Section A, Locker A105'.",
    ],
    samples: ["Section A, Locker A105", "Section B, Locker B203", ""],
  },
  // {
  //   header: "Assignable",
  //   field: "enableAssignFeature",
  //   required: false,
  //   width: 130,
  //   aliases: [
  //     "Assignable",
  //     "assignable",
  //     "enableAssignFeature",
  //     "enable_assign_feature",
  //   ],
  //   notes: [
  //     "May this unit be handed out to staff, events or members? Yes or No.",
  //     "Left blank it imports as No, and the unit cannot be assigned to anyone.",
  //   ],
  //   defaultNote: "Default: No",
  //   samples: ["Yes", "Yes", "No"],
  // },
  // {
  //   header: "Container",
  //   field: "container",
  //   required: false,
  //   width: 120,
  //   aliases: ["Container", "container"],
  //   notes: ["Is this unit itself a case, bin or box that holds others? Yes or No."],
  //   defaultNote: "Default: No",
  //   samples: ["No", "Yes", "No"],
  // },
  // {
  //   header: "Container Capacity",
  //   field: "containerSpotLimit",
  //   required: false,
  //   width: 160,
  //   aliases: ["Container Capacity", "container capacity", "containerSpotLimit"],
  //   notes: ["How many units fit inside. Only meaningful when Container is Yes."],
  //   defaultNote: "Default: empty",
  //   samples: ["", "24", ""],
  // },
  // {
  //   header: "Stored in container?",
  //   field: "isItInContainer",
  //   required: false,
  //   width: 170,
  //   aliases: [
  //     "Stored in container?",
  //     "stored in container?",
  //     "isItInContainer",
  //     "is_it_in_container",
  //   ],
  //   notes: ["Does this unit live inside a container? Yes or No."],
  //   defaultNote: "Default: No",
  //   samples: ["No", "No", "Yes"],
  // },
  {
    header: "Extra Info",
    field: "extra_serial_number",
    recommended: true,
    width: 200,
    notes: [
      "Extra identifiers for this unit, as key=value pairs separated by semicolons.",
      "e.g. 'Material=Silicon;MAC=00:1B:44:11:3A:B7'.",
      "A value without an '=' is discarded.",
    ],
    samples: ["Material=Silicon;Voltage=110V", "Frequency=72MHz", ""],
  },
  {
    header: "Image",
    field: "image_url",
    recommended: true,
    width: 150,
    notes: [
      "Place the picture inside the cell — Insert > Picture > Place in Cell.",
      "The picture travels inside the file, so nothing has to be hosted anywhere first.",
      "One picture per device name is enough; it is read from whichever rows carry it.",
    ],
    samples: ["", "", ""],
  },
  // {
  //   header: "Return Date",
  //   field: "return_date",
  //   required: false,
  //   width: 170,
  //   aliases: ["Return Date", "return date", "return_date"],
  //   notes: [
  //     "When a rented unit is due back, e.g. '2026-05-01 12:00:00'.",
  //     "Only meaningful when Ownership is Rent.",
  //   ],
  //   defaultNote: "Default: empty",
  //   samples: ["2026-05-01 12:00:00", "", "2026-05-15 10:00:00"],
  // },
  // {
  //   header: "Supplier Info",
  //   field: "supplier_info",
  //   required: false,
  //   width: 180,
  //   aliases: ["Supplier Info", "supplier info", "supplier_info"],
  //   notes: ["Who the unit is rented from, when it is rented equipment."],
  //   defaultNote: "Default: empty",
  //   samples: ["Rental Equipment LLC", "", "Rental Equipment LLC"],
  // },
];

const COLUMNS_BY_FIELD = new Map(
  INVENTORY_IMPORT_COLUMNS.map((column) => [column.field, column]),
);

const COLUMNS_BY_NORMALIZED_HEADER = new Map(
  INVENTORY_IMPORT_COLUMNS.map((column) => [normalizeHeader(column.header), column]),
);

/**
 * The column a header in the uploaded file refers to, or `undefined`.
 *
 * Exact on the header, forgiving only of case, surrounding space and the
 * asterisk. A misspelling is not a column.
 */
export const columnForHeader = (header) =>
  COLUMNS_BY_NORMALIZED_HEADER.get(normalizeHeader(header));

/**
 * The mandatory columns a file does not have.
 *
 * Without this, strictness reads as silence: rename "Category" to "Type" and
 * every row is missing a mandatory value, so all 500 are skipped one by one and
 * nobody is told the actual reason. Checking the header row once lets the
 * import say the true thing — this column is not here, and its name is not
 * yours to change.
 *
 * @param {string[]} headers - the keys of the file's first row.
 * @returns {string[]} the headers that should be there and are not.
 */
export const missingRequiredColumns = (headers = []) => {
  const present = new Set(headers.map(normalizeHeader));
  return REQUIRED_IMPORT_FIELDS.map((field) => COLUMNS_BY_FIELD.get(field))
    .filter((column) => column && !present.has(normalizeHeader(column.header)))
    .map((column) => column.header);
};

/** Headers in the file that no column claims. */
export const unknownColumns = (headers = []) =>
  headers.filter((header) => String(header ?? "").trim() && !columnForHeader(header));

/**
 * The column's display name, for messages that list required/recommended
 * fields by name — reading it from the one column definition instead of a
 * separately hand-typed list is what keeps that message from drifting again.
 * Falls back to the raw field name for one it doesn't recognize.
 */
export const headerFor = (field) => COLUMNS_BY_FIELD.get(field)?.header ?? field;

/** A cell the parser reads as "nothing was written here". */
export const isBlankImportValue = (value) =>
  value === "" || value === undefined || value === null;

/**
 * Which of the given values for a row are missing. A row with even one
 * missing required field is skipped rather than imported with a hole in it.
 * @param {Record<string, *>} values - this row's value per field name.
 * @param {string[]} [requiredFields] - defaults to every mandatory field.
 * @returns {string[]} the required fields this row left blank.
 */
export const missingRequiredFields = (values, requiredFields = REQUIRED_IMPORT_FIELDS) =>
  requiredFields.filter((field) => isBlankImportValue(values?.[field]));

const SAMPLE_COUNT = 3;

/**
 * Rows for the downloaded spreadsheet, keyed by header — this is what the user
 * types over, so the keys have to be the headers the parser looks for.
 */
export const buildTemplateRows = () =>
  Array.from({ length: SAMPLE_COUNT }, (_, index) =>
    INVENTORY_IMPORT_COLUMNS.reduce((row, column) => {
      row[column.header] = column.samples[index] ?? "";
      return row;
    }, {}),
  );

/**
 * The single illustrative row under the guide table, keyed by field to match
 * the antd `dataIndex`.
 */
export const buildGuideRow = () =>
  INVENTORY_IMPORT_COLUMNS.reduce(
    (row, column) => {
      row[column.field] = column.samples[0] ?? "";
      return row;
    },
    { key: "1" },
  );
