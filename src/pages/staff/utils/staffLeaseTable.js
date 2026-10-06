/**
 * What the staff are holding, and what is late.
 *
 * Asked for on 2026-10-06: the staff page should have the same tabbed
 * navigator the members page has, so the table is not the only thing there —
 * you can also see the devices staff are holding and which ones are overdue.
 *
 * The rows come from `POST /api/db_lease/status`
 * (`FRONTEND_server_updates_2026-07.md` §4), which classifies lateness on the
 * server. `overdue` arrives decided and is never recomputed here: the browser's
 * clock and the server's would eventually disagree about the same row.
 *
 * That contract documents `device_id` and `lessee_id` and leaves the rest open,
 * so the device's name is looked up in the company inventory this page already
 * knows how to fetch, and anything that cannot be resolved is shown by its id
 * rather than as a blank.
 */

const STATUS = {
  overdue: { label: "Overdue", tone: "critical" },
  outstanding: { label: "Out", tone: "warning" },
  returned: { label: "Returned", tone: "success" },
  lost: { label: "Lost", tone: "critical" },
  damaged: { label: "Damaged", tone: "warning" },
};

/** Title case, so a status we have no entry for still reads as a word. */
const titleCase = (value) => {
  const text = String(value ?? "").trim();
  return text ? text[0].toUpperCase() + text.slice(1).toLowerCase() : "Unknown";
};

const deviceLabelFor = (lease, itemsById) => {
  const item = itemsById?.get?.(lease?.device_id) ?? itemsById?.get?.(String(lease?.device_id));
  const serial = `${item?.serial_number ?? ""}`.trim();
  const group = `${item?.item_group ?? ""}`.trim();
  if (serial) return group ? `${group} · ${serial}` : serial;
  return `Device ${lease?.device_id ?? "—"}`;
};

/**
 * Who is holding it, by name and email.
 *
 * A staff id identifies nobody at a glance, which is the whole point of this
 * table. The lease rows carry the id, so the name is resolved the way the
 * device profile already resolves it: the id gives the email
 * (`/db_staff/consulting-member`), and the email gives the name among the
 * company's employees.
 *
 * While those lookups are in flight there is no name yet. The id is ugly but
 * it is not a lie, and it disappears as soon as the answer lands.
 */
const holderFor = (lease, staffById) => {
  const fromRow = `${lease?.lessee_name ?? ""}`.trim();
  const record =
    staffById?.get?.(lease?.lessee_id) ?? staffById?.get?.(String(lease?.lessee_id));
  const name = fromRow || `${record?.name ?? ""}`.trim();
  const email = `${record?.email ?? ""}`.trim();

  if (name) return { holderName: name, holderEmail: email || null };
  if (email) return { holderName: email, holderEmail: null };
  return { holderName: `Staff ${lease?.lessee_id ?? "—"}`, holderEmail: null };
};

/**
 * The staff loans, as table rows.
 *
 * @param {object[]} leases rows from POST /api/db_lease/status
 * @param {{itemsById?: Map, staffById?: Map}} sources the company inventory
 *   keyed by item_id, and the staff keyed by their SQL id
 */
export const staffLeaseRows = (leases, { itemsById, staffById } = {}) =>
  (Array.isArray(leases) ? leases : [])
    .filter((lease) => lease?.lessee_type === "staff")
    .map((lease, index) => {
      const status = STATUS[lease?.status] ?? {
        label: titleCase(lease?.status),
        tone: "neutral",
      };
      return {
        key: lease?.lease_key ?? `staff-lease-${index}`,
        deviceId: lease?.device_id ?? null,
        deviceLabel: deviceLabelFor(lease, itemsById),
        holderId: lease?.lessee_id ?? null,
        ...holderFor(lease, staffById),
        dueDate: lease?.expected_return_date ?? null,
        overdue: Boolean(lease?.overdue),
        statusLabel: status.label,
        statusTone: status.tone,
      };
    });

/** How many are out, and how many of those are late. */
export const staffLeaseCounts = (rows) => {
  const list = Array.isArray(rows) ? rows : [];
  return { total: list.length, overdue: list.filter((row) => row.overdue).length };
};
