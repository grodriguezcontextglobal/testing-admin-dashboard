/**
 * Returning rented equipment to the supplier that owns it.
 *
 * The flow used to be: write state onto every item, email the supplier, then
 * delete the items. The first step was pointless — nothing read what it wrote
 * and the delete threw it away seconds later — and it is what
 * `update-large-data` was rejecting for carrying `returnedRentedInfo`.
 *
 * The item row is going away, so the durable record of a return cannot live on
 * it. It lives in the two things that outlast the item: the report that goes
 * out, and the staff activity log. Both are built from the rows this file
 * resolves.
 *
 * ## The in-use rule, and why it is not here
 *
 * "An item that is out with somebody must not be deleted" —
 * `logistic_status !== "in-stock"` **and** `warehouse !== 1` — was implemented
 * here and has been removed. `inventory.itemsByIds` is a server-side catalog
 * entry and its projection returns neither column, so the rule had no input on
 * any real return: it either refused every item as unreadable, or announced on
 * every single return that it could not run. Neither of those is a guard.
 *
 * It comes back the day that query returns `logistic_status` and `warehouse` —
 * the ask is in FRONTEND_backend_ask_update_large_data.md, and the rule itself
 * is three lines. Until then the client cannot tell whether an item is out, and
 * this file does not pretend to: **a return can delete an item that is still
 * assigned to somebody.**
 */

const text = (value) => String(value ?? "").trim();

/** The item's id, under either spelling a query might use. */
export const itemIdOf = (item) => item?.item_id ?? item?.id ?? null;

/**
 * Splits what was asked for into what the server answered about and what it did
 * not.
 *
 * An id with no row cannot be reported on — there is no serial for the
 * spreadsheet and nothing to write to the audit log — and the server not having
 * it is not a reason to delete it. It is held back and named.
 */
export const partitionForReturn = ({ items, requestedIds }) => {
  const rows = Array.isArray(items) ? items : [];
  const byId = new Map();
  rows.forEach((row) => {
    const id = itemIdOf(row);
    if (id !== null && id !== undefined) byId.set(String(id), row);
  });

  const returnable = [];
  const blocked = [];

  (Array.isArray(requestedIds) ? requestedIds : []).forEach((id) => {
    const row = byId.get(String(id));
    if (!row) {
      blocked.push({
        item_id: id,
        serial_number: null,
        reason: "missing",
        detail: "it is no longer in the inventory",
      });
      return;
    }
    returnable.push(row);
  });

  return { returnable, blocked };
};

const nameThem = (entries) => {
  const named = entries
    .slice(0, 3)
    .map((entry) => text(entry.serial_number) || `item ${entry.item_id}`);
  const rest = entries.length - named.length;
  return `${named.join(", ")}${rest > 0 ? ` and ${rest} more` : ""}`;
};

/** What to tell the operator about the items that are staying. */
export const describeBlocked = (blocked) => {
  const list = Array.isArray(blocked) ? blocked : [];
  if (list.length === 0) return null;

  return `${list.length} item${list.length === 1 ? "" : "s"} ${
    list.length === 1 ? "is" : "are"
  } no longer in the inventory and will not be returned: ${nameThem(
    list
  )}. Reopen this list to see what is left.`;
};

/**
 * The rows of the report that goes to the supplier and to the company's own
 * staff. This is the record of the return: the item is deleted afterwards, so
 * nothing that is not in here survives.
 */
export const buildReturnReportRows = ({ items, supplierName, returnedBy, timestamp }) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    item_id: itemIdOf(item) ?? "",
    serial_number: text(item?.serial_number),
    item_group: text(item?.item_group),
    supplier: text(supplierName),
    returned_by: text(returnedBy),
    returned_at: text(timestamp),
  }));

/**
 * One audit row per item, in the shape POST /api/admin/activity-logs takes.
 *
 * Per item rather than per batch: the item record itself is about to be
 * deleted, so this is the only place each one is individually accounted for.
 * The convention is the module's own — an uppercase verb, a capitalised model,
 * and a `reason` in the details (see AdvanceGrades.jsx).
 */
export const buildReturnAuditEntries = ({ items, supplierId, returnedBy, timestamp }) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    action: "DELETE",
    target_model: "Item",
    target_id: itemIdOf(item),
    details: {
      reason: "returned_to_supplier",
      supplier_id: supplierId ?? null,
      returned_by: text(returnedBy) || null,
      return_timestamp: text(timestamp) || null,
      serial_number: text(item?.serial_number) || null,
      item_group: text(item?.item_group) || null,
    },
  }));
