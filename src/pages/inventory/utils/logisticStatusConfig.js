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
    allowedTransitions: ["received", "assigned", "in-stock"],
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
    allowedTransitions: ["in-transit", "received", "in-idle"],
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

export const getLogisticStatusLabel = (status) =>
  logisticStatusConfig[status]?.label ?? status ?? "";

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
