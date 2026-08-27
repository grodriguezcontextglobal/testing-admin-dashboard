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
 * out, and the staff activity log.
 *
 * The second thing this file decides is what may leave at all. An item that is
 * out with somebody is not returnable, whoever owns it.
 */

const IN_STOCK = "in-stock";

const text = (value) => String(value ?? "").trim();

/** The item's id, under either spelling a query might use. */
export const itemIdOf = (item) => item?.item_id ?? item?.id ?? null;

/**
 * Whether one item can leave the company's inventory.
 *
 * In use means both of these at once: its logistic status is not `in-stock`
 * **and** it is not in the warehouse. Either one on its own means it is
 * accounted for and can go back.
 *
 * Anything unreadable is treated as in use. A return deletes the record, so the
 * only safe default when the state cannot be established is to leave the item
 * alone — the operator is told, and nothing is deleted on an assumption.
 */
export const returnEligibility = (item) => {
  const status = text(item?.logistic_status).toLowerCase();
  const inWarehouse = Number(item?.warehouse) === 1;

  const knowsStatus = status.length > 0;
  const knowsWarehouse =
    item?.warehouse !== undefined && item?.warehouse !== null && item?.warehouse !== "";

  if (!knowsStatus && !knowsWarehouse) {
    return {
      returnable: false,
      reason: "unknown",
      detail: "its state could not be read",
    };
  }

  if (status !== IN_STOCK && !inWarehouse) {
    return {
      returnable: false,
      reason: "in-use",
      detail: knowsStatus ? `it is ${status}` : "it is not in the warehouse",
    };
  }

  return { returnable: true, reason: null, detail: null };
};

/**
 * Splits what was asked for into what may go and what may not.
 *
 * `requestedIds` matters: an id the state query did not answer for has no state
 * at all, which is exactly the case that must not be deleted. Dropping it
 * silently is how an in-use item would leave the inventory.
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
    const verdict = returnEligibility(row);
    if (verdict.returnable) {
      returnable.push(row);
    } else {
      blocked.push({
        item_id: id,
        serial_number: text(row.serial_number) || null,
        reason: verdict.reason,
        detail: verdict.detail,
      });
    }
  });

  return { returnable, blocked };
};

/** What to tell the operator about the items that are staying. */
export const describeBlocked = (blocked) => {
  const list = Array.isArray(blocked) ? blocked : [];
  if (list.length === 0) return null;

  const named = list
    .slice(0, 3)
    .map((entry) => text(entry.serial_number) || `item ${entry.item_id}`);
  const rest = list.length - named.length;

  return `${list.length} item${list.length === 1 ? "" : "s"} ${
    list.length === 1 ? "is" : "are"
  } still in use and will not be returned: ${named.join(", ")}${
    rest > 0 ? ` and ${rest} more` : ""
  }. Check them in first.`;
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
