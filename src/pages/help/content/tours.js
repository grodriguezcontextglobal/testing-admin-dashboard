/**
 * Guided tours — a mock of the screen, walked one region at a time.
 *
 * The mocks are deliberately schematic. A screenshot goes stale the first time
 * a button moves and nobody notices; a labelled block diagram stays true for
 * as long as the screen has that block, and it is the same decomposition the
 * articles already use — "Reading the event page" lists exactly these rows.
 *
 * Regions are data so the tests can prove every step highlights something and
 * every article link resolves. Keep row ids stable: the steps point at them.
 */

export const DASHBOARD_MOCKS = [
  {
    id: "eventPage",
    title: "The event page",
    subtitle: "What one event looks like, top to bottom",
    rows: [
      {
        id: "nav",
        kind: "nav",
        label: "Home · Inventory · Events · Consumers · Staff",
      },
      {
        id: "header",
        kind: "header",
        label: "Event name and address",
        aside: "Add new event",
      },
      {
        id: "detail",
        kind: "cards",
        cells: ["Contact", "Dates", "Actions", "QR code"],
      },
      { id: "health", kind: "bar", label: "Device health — out · back · lost" },
      { id: "lostfee", kind: "block", label: "Lost fee report" },
      {
        id: "inventory",
        kind: "block",
        label: "Inventory assigned to the event",
        aside: "grouped by kind",
      },
      { id: "devices", kind: "table", label: "Devices, serial by serial" },
      {
        id: "pills",
        kind: "pills",
        cells: ["No devices", "Pending to return", "In use", "Returned"],
      },
      { id: "consumers", kind: "table", label: "Consumers at the event" },
      { id: "staff", kind: "block", label: "Staff at the event", aside: "Update staff" },
    ],
  },
  {
    id: "inventoryPage",
    title: "The inventory page",
    subtitle: "Everything the company owns, and how to narrow it down",
    rows: [
      {
        id: "nav",
        kind: "nav",
        label: "Home · Inventory · Events · Consumers · Staff",
      },
      {
        id: "header",
        kind: "header",
        label: "Inventory",
        aside: "Add inventory · Import (.xlsx) · More options",
      },
      { id: "search", kind: "bar", label: "Search across the inventory" },
      {
        id: "filters",
        kind: "pills",
        cells: ["Brand", "Group", "Serial", "Location", "Ownership", "Status"],
      },
      {
        id: "views",
        kind: "cards",
        cells: ["By location", "By group", "By category", "By ownership"],
      },
      { id: "table", kind: "table", label: "Every item — status, condition, holder" },
    ],
  },
  {
    id: "consumerDetail",
    title: "One consumer",
    subtitle: "Transactions, the devices on them, and the money held",
    rows: [
      {
        id: "header",
        kind: "header",
        label: "Consumer name · email · phone",
      },
      {
        id: "rail",
        kind: "cards",
        cells: [
          "New transaction · no charge",
          "New transaction · take payment",
          "Add a service",
          "Email this consumer",
        ],
      },
      { id: "transactions", kind: "table", label: "Transactions" },
      { id: "devices", kind: "table", label: "Devices on the selected transaction" },
      { id: "deposit", kind: "block", label: "Deposit held", aside: "Release deposit" },
    ],
  },
];

export const SECTION_TOURS = [
  {
    sectionId: "events",
    mockId: "eventPage",
    title: "Take the tour of an event",
    steps: [
      {
        target: "nav",
        title: "Everything starts from Events",
        text: "The event list is where a job begins. Opening an event selects it, and every block below is about that one event until you open another.",
        article: "events-page",
      },
      {
        target: "header",
        title: "Which event you are looking at",
        text: "The name and address at the top are the event consumers see in every email about it. \"Add new event\" only appears for roles allowed to create one.",
        article: "events-create",
      },
      {
        target: "detail",
        title: "Contact, dates, actions, QR",
        text: "The QR code is what consumers scan to reach this event in the consumer app. The actions card is where ending the event lives.",
        article: "events-page",
      },
      {
        target: "health",
        title: "One bar for the whole event",
        text: "What is out, what is back, what is lost. Lost is counted separately on purpose, so losses are not hidden inside \"still out\".",
        article: "inventory-statuses",
      },
      {
        target: "inventory",
        title: "What you brought",
        text: "The equipment allocated to this event, grouped by kind. Devices arrive here by serial number — scanned in, or imported from a spreadsheet.",
        article: "events-devices",
      },
      {
        target: "devices",
        title: "And the same thing serial by serial",
        text: "The table underneath answers \"where is this exact device\" rather than \"how many do we have\".",
        article: "events-devices",
      },
      {
        target: "pills",
        title: "The four pills are the filter",
        text: "Each one says how many consumers are in that state, and clicking one filters the table to them. \"Pending to return\" is the group to work through at the end of an event.",
        article: "events-consumers",
      },
      {
        target: "consumers",
        title: "Who has what",
        text: "Search reads the whole record, not just the columns — a phone number or an id finds the person. Clicking a row opens their transactions.",
        article: "events-consumers",
      },
      {
        target: "staff",
        title: "Who is working it",
        text: "Staff access is per event, and closing the event takes it away. That is part of what closing does, not a side effect.",
        article: "events-staff",
      },
      {
        target: "detail",
        title: "Then you close it — by counting first",
        text: "\"End event\" opens a count before any confirmation: scan what came back, read the reconciliation, then either close and return what you counted, or keep the event open and go find the rest. Closing cannot be reversed.",
        article: "events-close",
      },
    ],
  },
  {
    sectionId: "inventory",
    mockId: "inventoryPage",
    title: "Take the tour of the inventory",
    steps: [
      {
        target: "header",
        title: "Three ways to add stock",
        text: "One item at a time, a numbered range at once, or a spreadsheet — download the template first, because the importer reads the template's columns.",
        article: "inventory-add",
      },
      {
        target: "search",
        title: "Search finds a specific device",
        text: "Serials are text, not numbers: leading zeros are part of the serial, and \"SN-0007\" is not \"SN-7\".",
        article: "inventory-browse",
      },
      {
        target: "filters",
        title: "Eight filters that combine",
        text: "Brand, group, serial, location, ownership, condition, staff member and status. Combining them asks narrow questions without scrolling a table.",
        article: "inventory-browse",
      },
      {
        target: "views",
        title: "Grouped views answer \"what do we have\"",
        text: "By location, group, category, brand or ownership. The flat table answers the other question — where one device is.",
        article: "inventory-browse",
      },
      {
        target: "table",
        title: "Status is where, condition is how",
        text: "They are separate axes on purpose: a broken device in the warehouse is in stock and in poor condition. Ownership is a third — owned, leased, or bought for resale.",
        article: "inventory-statuses",
      },
      {
        target: "header",
        title: "And bringing it back",
        text: "\"More options\" holds \"Check in devices from events\" — the warehouse side of closing an event, where equipment is read back into stock by serial.",
        article: "inventory-checkin",
      },
    ],
  },
  {
    sectionId: "consumers",
    mockId: "consumerDetail",
    title: "Take the tour of a consumer",
    steps: [
      {
        target: "header",
        title: "A consumer belongs to the company",
        text: "Not to one event. The same person can attend several, and their history follows them across all of them.",
        article: "consumers-find",
      },
      {
        target: "rail",
        title: "Nothing goes out without a transaction",
        text: "\"No charge\" hands equipment over with no money involved. \"Take payment\" asks for a card deposit or cash first.",
        article: "consumers-transaction",
      },
      {
        target: "transactions",
        title: "One consumer, several transactions",
        text: "A second transaction does not close the first, and a transaction settles itself once its last device comes back.",
        article: "consumers-transaction",
      },
      {
        target: "devices",
        title: "Assigning and returning, by serial",
        text: "Only a device allocated to this event can be assigned at it. Every assignment and every return emails the consumer what changed.",
        article: "consumers-assign",
      },
      {
        target: "deposit",
        title: "A held deposit is not a charge",
        text: "The amount shown is read live from the payment provider, so it is what the bank is actually holding. Releasing gives it back; capturing turns it into a real charge.",
        article: "consumers-deposit",
      },
      {
        target: "deposit",
        title: "The one people forget",
        text: "Closing an event does not release deposits. A held deposit outlives the event — release before closing, or work the list afterwards.",
        article: "consumers-deposit",
      },
    ],
  },
];
