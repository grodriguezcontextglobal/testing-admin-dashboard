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
 * An item whose state cannot be read is reported as `unknown`, separately from
 * `in-use`. Whether that blocks it is not decided here — see
 * `stateIsReadable`: one unreadable row among readable ones is suspicious and
 * is held back, but a whole response that carries neither field means the query
 * does not project them and the check simply cannot run.
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
 * Whether the response carries the two fields the check needs at all.
 *
 * `inventory.itemsByIds` is a server-side catalog entry and its projection is
 * not something the client can see. If it returns neither `logistic_status` nor
 * `warehouse` on any row, the in-use check has no input — and treating that as
 * "every item is in use" blocks every return, which is what happened to an
 * item that was plainly in stock.
 */
export const stateIsReadable = (items) =>
  (Array.isArray(items) ? items : []).some((item) => {
    const hasStatus = text(item?.logistic_status).length > 0;
    const hasWarehouse =
      item?.warehouse !== undefined &&
      item?.warehouse !== null &&
      item?.warehouse !== "";
    return hasStatus || hasWarehouse;
  });

/**
 * Splits what was asked for into what may go and what may not.
 *
 * `requestedIds` matters: an id the state query did not answer for is not in
 * the inventory any more, and that is not something to delete on. Dropping it
 * silently is how an in-use item would leave.
 *
 * `checked` says whether the in-use rule actually ran. When the response
 * carries no state at all it could not, and the rows are let through rather
 * than every return being blocked — the caller is expected to say so, because a
 * guard that silently did not apply is worse than no guard.
 */
export const partitionForReturn = ({ items, requestedIds }) => {
  const rows = Array.isArray(items) ? items : [];
  const byId = new Map();
  rows.forEach((row) => {
    const id = itemIdOf(row);
    if (id !== null && id !== undefined) byId.set(String(id), row);
  });

  const checked = stateIsReadable(rows);
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
    // Nothing to check against: let it through, and let the caller say so.
    if (!checked) {
      returnable.push(row);
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

  return { returnable, blocked, checked };
};

const REASON_COPY = {
  "in-use": { why: "still in use", fix: "Check them in first." },
  missing: {
    why: "no longer in the inventory",
    fix: "Reopen this list to see what is left.",
  },
  unknown: {
    why: "left alone because their state could not be read",
    fix: "Try again, or check them on the inventory page.",
  },
};

/**
 * Names each item and, where there is one, the state that held it back.
 *
 * `detail` was computed and never shown, so "still in use" gave the reader no
 * way to tell a genuinely assigned item from a status string the rule does not
 * recognise. The status is in the message now.
 */
const nameThem = (entries) => {
  const named = entries.slice(0, 3).map((entry) => {
    const label = text(entry.serial_number) || `item ${entry.item_id}`;
    const why = text(entry.detail);
    return why ? `${label} (${why})` : label;
  });
  const rest = entries.length - named.length;
  return `${named.join(", ")}${rest > 0 ? ` and ${rest} more` : ""}`;
};

/**
 * What to tell the operator about the items that are staying, per reason.
 *
 * It used to say "still in use" for all three, so an item held back because its
 * state could not be read was reported as being out with somebody -- which is
 * how a plainly in-stock item came back as "still in use".
 */
export const describeBlocked = (blocked) => {
  const list = Array.isArray(blocked) ? blocked : [];
  if (list.length === 0) return null;

  return Object.keys(REASON_COPY)
    .map((reason) => {
      const entries = list.filter((entry) => entry.reason === reason);
      if (entries.length === 0) return null;
      const { why, fix } = REASON_COPY[reason];
      return `${entries.length} item${entries.length === 1 ? "" : "s"} ${
        entries.length === 1 ? "is" : "are"
      } ${why} and will not be returned: ${nameThem(entries)}. ${fix}`;
    })
    .filter(Boolean)
    .join(" ");
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
