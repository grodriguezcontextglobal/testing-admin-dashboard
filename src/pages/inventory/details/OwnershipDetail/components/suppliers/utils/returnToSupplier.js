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

/**
 * The bodies for `POST /api/db_item/delete-bulk-items-criteria`.
 *
 * This replaces `POST /db_company/delete-bulk-items`, which took
 * `{ item_ids, company_id }`. The criteria endpoint deletes by what an item
 * *is* rather than by its id, and its contract is asymmetric:
 * `category_name` and `company_id` are required, `item_group` and
 * `serial_number` are optional filters. So one request cannot span two
 * categories or two groups, and the items are grouped accordingly.
 *
 * The safety rule is `serial_number`. It is the only field narrowing the delete
 * down to the items being returned — a body carrying a category and no serials
 * asks the server to delete that entire category. This never emits one. An item
 * that cannot be pinned to a serial, a category and a company is reported back
 * instead, and stays in the inventory.
 *
 * @param {object[]} items the rows being returned
 * @param {number|string} companyId the SQL company id
 * @param {object[]} fallbackRows rows from the table, consulted for a
 *   `category_name` the server projection did not include
 * @returns {{groups: object[], undeletable: object[]}}
 */
export const buildDeleteCriteriaGroups = ({ items, companyId, fallbackRows }) => {
  const rows = Array.isArray(items) ? items : [];
  if (rows.length === 0) return { groups: [], undeletable: [] };

  const byId = new Map();
  const bySerial = new Map();
  (Array.isArray(fallbackRows) ? fallbackRows : []).forEach((row) => {
    const id = itemIdOf(row);
    if (id !== null && id !== undefined) byId.set(String(id), row);
    const serial = text(row?.serial_number);
    if (serial) bySerial.set(serial, row);
  });

  const fallbackFor = (item) =>
    byId.get(String(itemIdOf(item))) ?? bySerial.get(text(item?.serial_number));

  const company = text(companyId);
  const groups = new Map();
  const undeletable = [];

  rows.forEach((item) => {
    const serial = text(item?.serial_number) || null;
    const known = fallbackFor(item);
    const category =
      text(item?.category_name) || text(known?.category_name) || null;
    const group = text(item?.item_group) || text(known?.item_group) || null;

    /* Reported in the order the request is judged: no company means nothing can
       be built at all, then the serial that narrows it, then the category the
       server requires. */
    const reason = !company
      ? "no-company"
      : !serial
      ? "no-serial"
      : !category
      ? "no-category"
      : null;

    if (reason) {
      undeletable.push({ item_id: itemIdOf(item), serial_number: serial, reason });
      return;
    }

    const key = `${category}\u0000${group ?? ""}`;
    if (!groups.has(key)) {
      groups.set(key, {
        company_id: companyId,
        serial_number: [],
        category_name: category,
        ...(group ? { item_group: group } : {}),
      });
    }
    const serials = groups.get(key).serial_number;
    if (!serials.includes(serial)) serials.push(serial);
  });

  return { groups: Array.from(groups.values()), undeletable };
};

const UNDELETABLE_REASONS = {
  "no-company": "this session has no company id",
  "no-serial": "the inventory has no serial number recorded for it",
  "no-category": "the inventory has no category recorded for it",
};

/**
 * What to tell the operator about items that were reported and logged but could
 * not be targeted for deletion. They are still in the inventory, and saying so
 * is the difference between a stale table and a silent data loss.
 */
export const describeUndeletable = (undeletable) => {
  const list = Array.isArray(undeletable) ? undeletable : [];
  if (list.length === 0) return null;

  const reason =
    UNDELETABLE_REASONS[list[0]?.reason] ?? "the inventory record is incomplete";

  return `${list.length} item${list.length === 1 ? " was" : "s were"} reported but not removed, because ${reason}: ${nameThem(
    list
  )}. Remove ${list.length === 1 ? "it" : "them"} by hand from the inventory table.`;
};
