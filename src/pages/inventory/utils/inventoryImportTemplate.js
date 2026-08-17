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
 * A row is skipped by the parser when any of these is blank. Everything else
 * has a default, so everything else is optional — the guide used to paint all
 * but one column red.
 */
export const REQUIRED_IMPORT_FIELDS = [
  "category_name",
  "item_group",
  "serial_number",
];

/**
 * Header normalization, matching what the parser does to each key it finds in
 * the sheet: forgive surrounding space, a trailing mandatory asterisk, and
 * casing. Anything beyond that has to be a declared alias.
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
 * `aliases` is what the parser accepts for that column. The header itself is
 * always among them, so a template that round-trips through Excel still parses.
 */
export const INVENTORY_IMPORT_COLUMNS = [
  {
    header: "Category",
    field: "category_name",
    required: true,
    width: 150,
    aliases: ["Category", "category_name", "category"],
    notes: ["The family the device belongs to, e.g. 'Audio', 'Interpretation'."],
    samples: ["Audio", "Interpretation", "Fitness"],
  },
  {
    header: "Device Name",
    field: "item_group",
    required: true,
    width: 180,
    aliases: ["Device Name", "device name", "item_group", "device_name"],
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
    aliases: ["Serial Number", "serial number", "serial_number"],
    notes: ["Unique per unit. One row per physical device."],
    samples: ["100001", "100002", "100003"],
  },
  {
    header: "Cost",
    field: "cost",
    required: false,
    width: 100,
    aliases: ["Cost", "cost"],
    notes: ["Replacement cost, as a number. Both 45.5 and 45,5 are accepted."],
    defaultNote: "Default: 0",
    samples: ["45.5", "99.0", "25.75"],
  },
  {
    header: "Brand",
    field: "brand",
    required: false,
    width: 120,
    aliases: ["Brand", "brand"],
    notes: ["Manufacturer, e.g. 'Sony', 'Apple'."],
    samples: ["Sony", "Congress Audio", "Cellucor"],
  },
  {
    header: "Description",
    field: "descript_item",
    required: false,
    width: 200,
    aliases: ["Description", "description", "descript_item"],
    notes: ["Free text."],
    defaultNote:
      "Left blank, one is composed from category, device name, brand and location.",
    samples: [
      "Audio Device 1 used for events and rentals",
      "Receiver used for interpretation events 70-75 MHz",
      "Pre workout supplement for fitness events",
    ],
  },
  {
    header: "Ownership",
    field: "ownership",
    required: false,
    width: 120,
    aliases: ["Ownership", "ownership"],
    notes: [
      "Stored as one of: Permanent, Rent, Sale.",
      "Common synonyms are mapped for you — Owned, Purchased and Donated become Permanent; Rental, Leased and Loaned become Rent; Sold and Consignment become Sale.",
    ],
    samples: ["Rent", "Permanent", "Rent"],
  },
  {
    header: "Main Warehouse",
    field: "main_warehouse",
    required: false,
    width: 160,
    aliases: ["Main Warehouse", "main warehouse", "main_warehouse"],
    notes: ["Where the device is deductible for taxes, e.g. 'Miami, FL'."],
    samples: ["Miami, FL", "Fort Lauderdale, FL", "Miami, FL"],
  },
  {
    header: "Warehouse",
    field: "warehouse",
    required: false,
    width: 120,
    aliases: ["Warehouse", "warehouse"],
    notes: ["Is the unit in stock right now? Yes or No."],
    defaultNote: "Default: No",
    samples: ["Yes", "No", "Yes"],
  },
  {
    header: "Location",
    field: "location",
    required: false,
    width: 150,
    aliases: ["Location", "location"],
    notes: [
      "Where the unit physically sits, e.g. 'Miami, FL'.",
      "A location that does not exist yet is created during the import.",
    ],
    samples: ["Miami, FL", "Orlando, FL", "Miami, FL"],
  },
  {
    header: "Sub Locations",
    field: "sub_location",
    required: false,
    width: 180,
    aliases: ["Sub Locations", "sub locations", "sub_location"],
    notes: [
      "Comma-separated path inside the location, outermost first.",
      "e.g. 'Section A, Locker A105'.",
    ],
    defaultNote: "Default: empty",
    samples: ["Section A, Locker A105", "Section B, Locker B203", ""],
  },
  {
    header: "Assignable",
    field: "enableAssignFeature",
    required: false,
    width: 130,
    aliases: [
      "Assignable",
      "assignable",
      "enableAssignFeature",
      "enable_assign_feature",
    ],
    notes: [
      "May this unit be handed out to staff, events or members? Yes or No.",
      "Left blank it imports as No, and the unit cannot be assigned to anyone.",
    ],
    defaultNote: "Default: No",
    samples: ["Yes", "Yes", "No"],
  },
  {
    header: "Container",
    field: "container",
    required: false,
    width: 120,
    aliases: ["Container", "container"],
    notes: ["Is this unit itself a case, bin or box that holds others? Yes or No."],
    defaultNote: "Default: No",
    samples: ["No", "Yes", "No"],
  },
  {
    header: "Container Capacity",
    field: "containerSpotLimit",
    required: false,
    width: 160,
    aliases: ["Container Capacity", "container capacity", "containerSpotLimit"],
    notes: ["How many units fit inside. Only meaningful when Container is Yes."],
    defaultNote: "Default: empty",
    samples: ["", "24", ""],
  },
  {
    header: "Stored in container?",
    field: "isItInContainer",
    required: false,
    width: 170,
    aliases: [
      "Stored in container?",
      "stored in container?",
      "isItInContainer",
      "is_it_in_container",
    ],
    notes: ["Does this unit live inside a container? Yes or No."],
    defaultNote: "Default: No",
    samples: ["No", "No", "Yes"],
  },
  {
    header: "Extra Info",
    field: "extra_serial_number",
    required: false,
    width: 200,
    aliases: [
      "Extra Info",
      "extra info",
      // Kept: this misspelling shipped as an accepted alias, and spreadsheets
      // built against it are still out there.
      "exra info",
      "extra_serial_number",
    ],
    notes: [
      "Extra identifiers for this unit, as key=value pairs separated by semicolons.",
      "e.g. 'Material=Silicon;MAC=00:1B:44:11:3A:B7'.",
      "A value without an '=' is discarded.",
    ],
    defaultNote: "Default: empty",
    samples: ["Material=Silicon;Voltage=110V", "Frequency=72MHz", ""],
  },
  {
    header: "Image",
    field: "image_url",
    required: false,
    width: 150,
    aliases: ["Image", "image", "image_url"],
    notes: ["A public URL to a picture of the device."],
    defaultNote: "Default: empty",
    samples: ["", "", ""],
  },
  {
    header: "Return Date",
    field: "return_date",
    required: false,
    width: 170,
    aliases: ["Return Date", "return date", "return_date"],
    notes: [
      "When a rented unit is due back, e.g. '2026-05-01 12:00:00'.",
      "Only meaningful when Ownership is Rent.",
    ],
    defaultNote: "Default: empty",
    samples: ["2026-05-01 12:00:00", "", "2026-05-15 10:00:00"],
  },
  {
    header: "Supplier Info",
    field: "supplier_info",
    required: false,
    width: 180,
    aliases: ["Supplier Info", "supplier info", "supplier_info"],
    notes: ["Who the unit is rented from, when it is rented equipment."],
    defaultNote: "Default: empty",
    samples: ["Rental Equipment LLC", "", "Rental Equipment LLC"],
  },
];

const COLUMNS_BY_FIELD = new Map(
  INVENTORY_IMPORT_COLUMNS.map((column) => [column.field, column]),
);

/**
 * Header spellings the parser accepts for a field. Returns an empty list for an
 * unknown field so a caller that reads a stale name degrades to "no alias"
 * rather than throwing mid-import.
 */
export const aliasesFor = (field) => COLUMNS_BY_FIELD.get(field)?.aliases ?? [];

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
