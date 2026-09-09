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
    id: "studentProfile",
    title: "One student",
    subtitle: "Who they are, what they hold, and whether consent is on file",
    rows: [
      {
        id: "header",
        kind: "header",
        label: "Student name · year · guardian",
        aside: "minor",
      },
      {
        id: "tabs",
        kind: "pills",
        cells: ["Devices", "Details", "Reminders"],
      },
      {
        id: "rail",
        kind: "cards",
        cells: ["Assign a device", "Send a reminder", "Report damage", "Charge a fee"],
      },
      {
        id: "consent",
        kind: "block",
        label: "Guardian consent",
        aside: "recorded · missing",
      },
      { id: "devices", kind: "table", label: "What this student is holding" },
    ],
  },
  {
    id: "profileSettings",
    title: "Profile and settings",
    subtitle: "Grouped by what each page governs — you, the company, or access",
    rows: [
      {
        id: "mine",
        kind: "cards",
        cells: ["My details", "Password", "Two-factor", "Notifications"],
      },
      {
        id: "company",
        kind: "cards",
        cells: ["Company info", "Email branding", "Documents", "Providers"],
      },
      {
        id: "governed",
        kind: "cards",
        cells: ["Roles", "Staff activity", "School compliance"],
      },
      {
        id: "money",
        kind: "cards",
        cells: ["Billing", "Connected account"],
      },
      {
        id: "platform",
        kind: "block",
        label: "Platform policies",
        aside: "System jobs — Devitrak staff only",
      },
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
    sectionId: "students",
    mockId: "studentProfile",
    title: "Take the tour of a student",
    steps: [
      {
        target: "header",
        title: "A student, not an event attendee",
        text: "The record belongs to the school and outlives any one trip or term. For a minor it carries the guardian, because almost everything the app sends about this student goes to them instead.",
        article: "students-profile",
      },
      {
        target: "tabs",
        title: "Three places, not three actions",
        text: "Devices is what they hold, Details is who they are, Reminders is what has been sent. Each has its own permission, so a role can see a student without being able to edit them — and a tab it cannot open is not shown at all.",
        article: "students-profile",
      },
      {
        target: "consent",
        title: "For a minor, consent is the gate",
        text: "With enforcement on, a device cannot be handed to a minor until a guardian has answered. An unanswered request is not consent: the assignment stays blocked rather than going through with a warning.",
        article: "students-consent",
      },
      {
        target: "rail",
        title: "The things you do are actions, not tabs",
        text: "Assigning, reminding, reporting damage and charging a fee live on the identity card. A one-shot action in a tab bar makes people think they navigated somewhere and then wonder how to get back.",
        article: "students-assign",
      },
      {
        target: "devices",
        title: "Holding, returned, and returned broken",
        text: "A damaged return is recorded as an incident rather than as a clean one — the distinction is what a conversation with a parent rests on, and it follows the device back into inventory as its condition.",
        article: "students-return",
      },
      {
        target: "rail",
        title: "And what it costs when it does not come back",
        text: "A lost device is its own state, so losses are never hidden inside \"still out\". The fee's receipt goes to the guardian for a minor — check the address before charging, not after.",
        article: "students-fees",
      },
    ],
  },
  {
    sectionId: "profile",
    mockId: "profileSettings",
    title: "Take the tour of the settings",
    steps: [
      {
        target: "mine",
        title: "These four are yours",
        text: "Your name, your password, your authenticator, your notifications. No permission gates any of them, and changing them affects nobody else.",
        article: "profile-my-details",
      },
      {
        target: "company",
        title: "These are the company's",
        text: "One identity everybody in it shares. Company info is what appears on a receipt; email branding is what a guardian sees in their inbox — and branding is off until somebody turns it on, which is the usual reason it \"did not apply\".",
        article: "profile-email-branding",
      },
      {
        target: "governed",
        title: "And these decide what everybody else can do",
        text: "Roles is the real access control: six main roles plus four scoped ones, and the difference between them is exactly what the app allows. School compliance decides whether a minor can be handed a device at all.",
        article: "staff-roles",
      },
      {
        target: "money",
        title: "Two different kinds of money",
        text: "Billing is what the company pays Devitrak. The connected account is what the company gets paid into — without it there is no card payment at all, so no deposits and no fees.",
        article: "profile-billing",
      },
      {
        target: "platform",
        title: "One page no role can grant",
        text: "System jobs is gated on an employee-level super-user flag rather than on a role, so changing somebody's role will never open it. If a page stays shut for an administrator, this is why.",
        article: "profile-policies",
      },
    ],
  },
];
