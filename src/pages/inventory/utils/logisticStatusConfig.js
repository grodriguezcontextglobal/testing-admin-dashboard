/**
 * Where one unit of the company's inventory is, as `item_inv.logistic_status`
 * records it: handed to an event, handed to a staff member or a student,
 * reserved, out of the warehouse, sitting in the warehouse, or lost. It is a
 * fact about **the unit**, and it is the question this file answers.
 *
 * **The event asks a different question with a different column.** An event's
 * `logistic_inventory_status` — `no_received_yet`, `received`, `completed`,
 * `in-transit`, `in-idle` — says whether **the event** has its inventory yet:
 * still waiting for it, holding it, or finished and sending it back to the
 * warehouse. It is read in `CardEventDisplay` and `eventStatusHelpers`, and
 * none of its words belong here. A unit out at an event is `in-event`; the
 * event it went to may be `in-idle`.
 *
 * Three of the event's words used to appear in `allowedTransitions` below,
 * which made them look like item states somebody had forgotten to define. A
 * test now pins that every transition names a state this file declares.
 *
 * Note that the app writes six of these — `in-stock`, `assigned`, `in-event`,
 * `in-transit`, `in-reserved`, `lost`. The rest are declared here and written
 * by nothing in this client, so they reach a filter only if something else put
 * them in the data.
 */
export const logisticStatusConfig = {
  allocated: {
    label: "Allocated",
    description: "Item is assigned to an event or user but not yet in use",
    category: "assignment",
    allowedTransitions: ["in-transit", "assigned", "in-stock"],
  },
  archived: {
    label: "Archived",
    description: "Item is inactive or removed from operations",
    category: "system",
    allowedTransitions: [],
  },
  assigned: {
    label: "Assigned",
    description: "Item is assigned to a user or event",
    category: "assignment",
    allowedTransitions: ["in-use", "returned", "lost", "damaged"],
  },
  "awaiting-pickup": {
    label: "Awaiting Pickup",
    description: "Item is ready to be picked up by user or staff",
    category: "logistics",
    allowedTransitions: ["assigned", "in-transit"],
  },
  damaged: {
    label: "Damaged",
    description: "Item is broken or not usable",
    category: "exception",
    allowedTransitions: ["under-maintenance", "archived"],
  },
  "in-container": {
    label: "In Container",
    description: "Item is stored inside a container",
    category: "storage",
    allowedTransitions: ["in-stock", "in-transit"],
  },
  "in-event": {
    label: "In Event",
    description: "Item is being used in an event",
    category: "usage",
    allowedTransitions: ["in-event", "in-use"],
  },
    "in-reserved": {
    label: "Reserved",
    description: "Item is reserved for an event",
    category: "usage",
    allowedTransitions: ["reserved", "in-transit", "shipped"],
  },
  "in-stock": {
    label: "In Stock",
    description: "Item is available in warehouse and ready for assignment",
    category: "availability",
    allowedTransitions: ["reserved", "allocated", "in-transit", "archived"],
  },  
  "in-transit": {
    label: "In Transit",
    description: "Item is moving between locations",
    category: "logistics",
    // `received` used to sit here. It is a value of the event's
    // `logistic_inventory_status`, not of an item's — see the note at the top.
    allowedTransitions: ["in-event", "assigned", "in-stock"],
  },
  "in-use": {
    label: "In Use",
    description: "Item is actively being used",
    category: "logistics",
    allowedTransitions: ["returned", "damaged", "lost"],
  },
  lost: {
    label: "Lost",
    description: "Item is missing and not returned",
    category: "exception",
    allowedTransitions: [],
  },
  "pending-checkin": {
    label: "Pending Check-in",
    description: "Item returned but not yet verified or processed",
    category: "return",
    allowedTransitions: ["under-inspection", "in-stock"],
  },
  "ready-for-restock": {
    label: "Ready for Restock",
    description: "Item is cleared and ready to go back to inventory",
    category: "return",
    allowedTransitions: ["in-stock"],
  },
    reserved: {
    label: "Reserved",
    description: "Item is reserved for a future assignment but still in place",
    category: "availability",
    allowedTransitions: ["allocated", "in-stock", "in-transit"],
  },
  returned: {
    label: "Returned",
    description: "Item has been returned from use",
    category: "return",
    allowedTransitions: ["pending-checkin", "in-stock"],
  },
  "shipped": {
    label: "Shipped",
    description: "Item was shipped to event",
    category: "usage",
    // Was ["in-transit", "received", "in-idle"]. The last two are the event's
    // words for what happens to the shipment; the item's word for arriving at
    // an event is `in-event`.
    allowedTransitions: ["in-transit", "in-event", "in-stock"],
  },
  "under-inspection": {
    label: "Under Inspection",
    description: "Item is being checked for damage or issues",
    category: "return",
    allowedTransitions: ["ready-for-restock", "damaged", "under-maintenance"],
  },
  "under-maintenance": {
    label: "Under Maintenance",
    description: "Item is being repaired",
    category: "exception",
    allowedTransitions: ["in-stock", "archived"],
  },
};

const categoryColorMap = {
  assignment: "brand",
  availability: "success",
  exception: "error",
  logistics: "brand",
  return: "warning",
  storage: "gray",
  system: "gray",
  usage: "success",
};

/**
 * `in-idle` → `In idle`. For a status this file has no entry for — and it has
 * none for `received` or `in-idle`, both of which it names as allowed
 * transitions — the token itself is the most honest label available. It is at
 * least the word the record holds, which a blank row is not.
 */
const humanize = (status) => {
  const words = String(status).replace(/[-_]+/g, " ").trim();
  return words ? words[0].toUpperCase() + words.slice(1) : "";
};

export const getLogisticStatusLabel = (status) =>
  logisticStatusConfig[status]?.label ?? (status ? humanize(status) : "");

export const getLogisticStatusColor = (status) => {
  const category = logisticStatusConfig[status]?.category;
  return categoryColorMap[category] ?? "gray";
};

export const getLogisticStatusDescription = (status) =>
  logisticStatusConfig[status]?.description ?? "";

export const getAllowedTransitions = (status) =>
  logisticStatusConfig[status]?.allowedTransitions ?? [];

export const logisticStatusFilters = Object.entries(logisticStatusConfig).map(
  ([value, { label }]) => ({ text: label, value })
);
