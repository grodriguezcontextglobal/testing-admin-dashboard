/**
 * Requested versus assigned, per device type, for a single transaction.
 *
 * This was three nested IIFEs inside a render function
 * (DisplayDeviceRequestedLegendPerTransaction) with no way to test the one thing
 * that matters: whether a transaction is fully handed over. It drives both the
 * progress panel and whether the serial-number input is still shown, so it gets
 * to be a tested function.
 */

/** `Event Inventory tablet` and `tablet` are the same device type. */
const normalizeType = (value) =>
  String(value ?? "")
    .trim()
    .replace(/^(event inventory|staff devices)\s*/i, "")
    .trim()
    .toLowerCase();

const prettyType = (value) =>
  String(value ?? "")
    .trim()
    .replace(/^(Event Inventory|Staff Devices)\s*/i, "")
    .trim() || "Unknown";

/**
 * Receiver records flattened into table rows, newest record per serial.
 *
 * Returning a unit and re-assigning it leaves two receiver rows for one serial,
 * and the table has to show the live one. The receiver id rides along under two
 * names — see the note inside.
 *
 * Split out from `devicesForTransaction` because some callers already hold a
 * list scoped to one payment intent by the query itself and must not filter it
 * again: `/receiver/receiver-assigned` is asked for a single intent, and its
 * records do not necessarily echo the field back.
 */
export function toDeviceRows(receivers) {
  const list = Array.isArray(receivers) ? receivers : [];
  const bySerial = new Map();

  list.forEach((receiver) => {
    const device = receiver?.device ?? {};
    const serial = device.serialNumber ?? receiver?.id;
    // Later records win: the list arrives oldest-first.
    bySerial.set(serial, {
      key: receiver?.id ?? serial,
      // `id` is the receiver id under the name the bulk-return and
      // express-check-in modals already read it by. They used to be handed
      // rows built as `{ key: receiver.id, ...receiver.device }`, where `id`
      // was undefined — so every chip in those modals shared the same React
      // key and the endpoints got no receiver id at all.
      id: receiver?.id,
      receiverId: receiver?.id,
      serialNumber: device.serialNumber,
      deviceType: device.deviceType,
      deviceValue: device.deviceValue,
      status: device.status,
      paymentIntent: receiver?.paymentIntent,
    });
  });

  return Array.from(bySerial.values());
}

/** The devices already handed over on one transaction. */
export function devicesForTransaction(receivers, paymentIntent) {
  const list = Array.isArray(receivers) ? receivers : [];
  return toDeviceRows(
    list.filter((receiver) => receiver?.paymentIntent === paymentIntent)
  );
}

/** Flatten the request lines, which the API sends either flat or nested. */
const requestLines = (record) => {
  const root = Array.isArray(record?.device) ? record.device : [];
  return root.flatMap((entry) =>
    Array.isArray(entry?.device) ? entry.device : [entry]
  );
};

export function summarizeAssignment(record, assignedRows) {
  const requested = new Map();
  const labels = new Map();

  requestLines(record).forEach((line) => {
    const quantity = Number(line?.deviceNeeded) || 0;
    const raw = String(line?.deviceType ?? "");
    // The API writes the literal string "undefined" into deviceType on some
    // legacy rows; a request line for a nameless device is not a request.
    if (quantity <= 0 || raw.toLowerCase() === "undefined" || !raw.trim()) return;

    const key = normalizeType(raw);
    requested.set(key, (requested.get(key) || 0) + quantity);
    if (!labels.has(key)) labels.set(key, prettyType(raw));
  });

  const assigned = new Map();
  (Array.isArray(assignedRows) ? assignedRows : []).forEach((row) => {
    const key = normalizeType(row?.deviceType);
    if (!key) return;
    // Returned and lost units both still count as handed over: the request was
    // fulfilled once, and re-requesting would double-count it.
    assigned.set(key, (assigned.get(key) || 0) + 1);
    if (!labels.has(key)) labels.set(key, prettyType(row?.deviceType));
  });

  const rows = Array.from(new Set([...requested.keys(), ...assigned.keys()]))
    .map((key) => {
      const requestedCount = requested.get(key) || 0;
      const assignedCount = assigned.get(key) || 0;
      return {
        deviceType: labels.get(key) || key,
        requested: requestedCount,
        assigned: assignedCount,
        remaining: Math.max(requestedCount - assignedCount, 0),
      };
    })
    .sort(
      (a, b) =>
        b.requested - a.requested || a.deviceType.localeCompare(b.deviceType)
    );

  const totals = rows.reduce(
    (acc, row) => ({
      requested: acc.requested + row.requested,
      assigned: acc.assigned + row.assigned,
      remaining: acc.remaining + row.remaining,
    }),
    { requested: 0, assigned: 0, remaining: 0 }
  );

  return { rows, totals, isComplete: totals.remaining === 0 };
}
