/**
 * Inventory — the manual.
 *
 * Written against the code: the filter dimensions come from
 * inventory/utils/dicSelectedOptions, the ownership vocabulary from the same
 * file's `dictionary`, the logistic statuses from utils/FilterOptionsUX, the
 * page's actions from utils/HeaderInventaryComponent, and the shipment rules
 * from actions/utils/shipping.
 */

export const inventorySection = {
  id: "inventory",
  title: "Inventory",
  summary:
    "Every device the company owns, leases or resells, and where each one is right now. Inventory is the source of truth an event borrows from — a device allocated to an event is still an inventory item, it is just somewhere else.",
  articles: [
    {
      id: "inventory-browse",
      title: "Finding a device",
      appRoute: "/inventory",
      summary:
        "One search box and eight filters. The filters combine, so you can ask narrow questions — this brand, in this location, in this condition — without scrolling a table.",
      steps: [
        {
          text: "Type in the search bar to match across the inventory, or use the filters for a specific dimension.",
        },
        {
          text: "Filter by Brand, Group, Serial Number, Location, Ownership, Condition, Staff member or Status.",
        },
        {
          text: "Or open a grouped view: by location, by group, by category, by brand, or by ownership.",
          note: "Grouped views answer \"what do we have\" — the flat table answers \"where is this one\".",
        },
        {
          text: "Click an item to open its detail page, which carries its history, its documents and its current holder.",
        },
      ],
      rules: [
        "Serial numbers are text, not numbers. Leading zeros are part of the serial, and \"SN-0007\" is not \"SN-7\".",
        "What you can see is scoped to your locations. A manager scoped to one warehouse does not see another's stock.",
      ],
      related: ["inventory-statuses", "inventory-locations"],
    },
    {
      id: "inventory-add",
      title: "Adding devices",
      appRoute: "/inventory",
      summary:
        "Three ways in, depending on how many devices you have in front of you: one at a time, a numbered range at once, or a spreadsheet.",
      steps: [
        {
          text: "\"Add inventory\" adds a single item — brand, model, serial, location, ownership and condition.",
        },
        {
          text: "For a numbered range, use the bulk form: it takes the first serial and how many, and creates the run for you.",
          note: "The counter is the trailing part of the serial. A range starting at \"CAM-0100\" continues CAM-0101, CAM-0102 — the prefix is kept intact.",
        },
        {
          text: "\"Import inventory (.xlsx)\" takes a spreadsheet. Download the template first — the importer reads the template's columns.",
        },
      ],
      rules: [
        "A serial number is unique within the company. The importer reports a serial that already exists rather than creating a second record for the same device.",
      ],
      pitfalls: [
        "Check the ownership when adding: Permanent, Leased and For resale behave differently later — a leased device has a supplier to return it to, and a resale device leaves the inventory when it sells.",
      ],
      related: ["inventory-statuses", "inventory-suppliers"],
    },
    {
      id: "inventory-statuses",
      title: "What each status means",
      appRoute: "/inventory",
      summary:
        "Status answers \"where is this device\", not \"is it working\" — that is Condition. The two are separate on purpose: a broken device sitting in the warehouse is in stock and in poor condition.",
      rules: [
        "In stock — in a warehouse, available to allocate.",
        "Reserved — held for something upcoming, not available to allocate elsewhere.",
        "Ready to ship — packed and waiting for the courier.",
        "In transit — with the courier, on the way.",
        "Shipped / Delivered — arrived at the destination.",
        "In event — allocated to an event, not yet handed to a consumer.",
        "Assigned — handed to a consumer, out of the company's hands.",
        "Ownership is a different axis again: Permanent (owned), Leased (rented from a supplier), For resale (bought to sell).",
      ],
      pitfalls: [
        "A device that reads \"Assigned\" after an event has closed means a consumer record still shows it out. Closing an event reports that disagreement instead of hiding it — somebody has to chase it.",
      ],
      related: ["inventory-browse", "inventory-checkin", "events-close"],
    },
    {
      id: "inventory-locations",
      title: "Locations",
      appRoute: "/inventory/location",
      summary:
        "A location is a place stock lives — a warehouse, a room, a client site. Locations are also how access is scoped: a staff member can be limited to the ones they work in.",
      steps: [
        { text: "Create a location from the inventory page before assigning stock to it." },
        {
          text: "Open a location to see everything in it, grouped by kind.",
        },
        {
          text: "Move stock by editing the items, or by shipping them (which records the movement).",
        },
      ],
      rules: [
        "Deleting or renaming a location does not move the stock inside it. Empty it first.",
        "A staff member scoped to particular locations sees only those, everywhere in the app — not just on this page.",
      ],
      related: ["inventory-shipping", "staff-roles"],
    },
    {
      id: "inventory-checkin",
      title: "Checking devices back in from an event",
      appRoute: "/inventory",
      summary:
        "The warehouse-side counterpart to closing an event: equipment coming off a job is read back into stock by serial.",
      steps: [
        {
          text: "\"More options\" → \"Check in devices from events\".",
        },
        {
          text: "Scan or paste the serials that came back.",
          note: "Duplicated reads are reported as duplicates, not counted twice.",
        },
        {
          text: "Confirm. The devices return to stock at their location.",
        },
      ],
      rules: [
        "A serial the event does not have is reported as unknown rather than silently added.",
        "This is available to roles that manage devices; an assistant does not see the option.",
      ],
      related: ["events-close", "inventory-statuses"],
    },
    {
      id: "inventory-shipping",
      title: "Shipping stock",
      appRoute: "/inventory",
      summary:
        "Recording a shipment so stock in motion is not stock that has vanished. Every shipment keeps who authorised it and who received it.",
      steps: [
        {
          text: "Select what is going, then open the shipping form.",
        },
        {
          text: "Fill in all five required fields: Destination, Courier, Tracking number, Authorised by, Received by.",
        },
        {
          text: "Send. UPS, USPS, FedEx and DHL tracking numbers become links to the carrier's own tracking page.",
        },
        {
          text: "The shipment record keeps the history, searchable after the fact.",
        },
      ],
      rules: [
        "All five fields are required — the form names the ones still empty rather than failing on submit.",
      ],
      pitfalls: [
        "The ship-out date is printed on the packing report but is not stored: the endpoint has no field for it. Do not rely on it being retrievable later — if the date matters, it belongs in the shipment record's own paperwork until the server keeps it.",
      ],
      related: ["inventory-locations", "inventory-statuses"],
    },
    {
      id: "inventory-suppliers",
      title: "Leased stock and suppliers",
      appRoute: "/inventory/ownership",
      summary:
        "Devices that are not yours. Leased stock has an owner to return it to and a date it is due, and that changes what the app lets you do with it.",
      steps: [
        { text: "Open the ownership view to see what is leased and from whom." },
        { text: "A supplier's page carries their items and their documents." },
        {
          text: "Returning leased items to a supplier removes them from inventory — they are not yours to hold any more.",
        },
      ],
      rules: [
        "Ownership vocabulary: Permanent is owned outright, Leased is rented in from a supplier, For resale is stock bought to sell on.",
      ],
      pitfalls: [
        "Returning to a supplier deletes the items from inventory. It is not a status change, and it is not reversible from the app — count before confirming.",
        "Supplier documents can be uploaded but there is no download route yet, so treat the upload as a record that a document exists, not as your only copy of it.",
      ],
      related: ["inventory-statuses", "inventory-browse"],
    },
  ],
};
