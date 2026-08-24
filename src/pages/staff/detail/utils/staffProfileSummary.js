/**
 * What a staff profile is read for: what this person is holding, what it is
 * worth, whether they have signed for it, and which events they are on.
 *
 * The page used to compute all of this inside render functions — the header
 * filtered events into a `Set` of freshly built objects (so every entry was
 * unique and the dedupe did nothing), the overview filtered the same list a
 * second time with different rules, and the device table joined leases to
 * inventory inside a column renderer that read
 * `images[group].at(-1).source` with no guard, so a single item group without
 * a photo threw and took the whole table with it.
 */

const text = (value) => String(value ?? "").trim();
const fold = (value) => text(value).toLowerCase();

const amount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** The role this person holds on one event, or null if they are not on it. */
const roleOnEvent = (item, email) => {
  const wanted = fold(email);
  if (!wanted) return null;

  const admins = Array.isArray(item?.staff?.adminUser) ? item.staff.adminUser : [];
  if (admins.some((member) => fold(member?.email) === wanted)) return "Administrator";

  const attendees = Array.isArray(item?.staff?.headsetAttendees)
    ? item.staff.headsetAttendees
    : [];
  if (attendees.some((member) => fold(member?.email) === wanted)) return "Coordinator";

  return null;
};

/** Every event this person is on, with the role they hold there. */
export function staffEventRows(events, email) {
  const list = Array.isArray(events) ? events : [];

  return list.reduce((rows, item, index) => {
    const role = roleOnEvent(item, email);
    if (!role) return rows;

    rows.push({
      // Two events can share a name, so the key comes from the record.
      key: text(item?.id ?? item?._id) || `event-${index}`,
      event: text(item?.eventInfoDetail?.eventName) || "Untitled event",
      role,
      active: Boolean(item?.active),
      dateBegin: item?.eventInfoDetail?.dateBegin ?? null,
      entireData: item,
    });
    return rows;
  }, []);
}

/** The live events only, soonest first — what the header chip is for. */
export function activeEventsForStaff(events, email) {
  return staffEventRows(events, email)
    .filter((row) => row.active)
    .sort((a, b) => new Date(a.dateBegin ?? 0) - new Date(b.dateBegin ?? 0));
}

/**
 * One row per lease, joined to the inventory record and the item photo.
 *
 * Every lookup is guarded: a lease can outlive the item it points at, and an
 * item group can have no image.
 */
export function deviceRowsForStaff(leases, items, images) {
  const leaseList = Array.isArray(leases) ? leases : [];

  // Later records win: the newest row for an item id is the live one.
  const itemById = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    if (item?.item_id === undefined || item?.item_id === null) return;
    itemById.set(String(item.item_id), item);
  });

  const photoByGroup = new Map();
  (Array.isArray(images) ? images : []).forEach((image) => {
    const group = text(image?.item_group);
    if (!group || !image?.source) return;
    photoByGroup.set(group, image.source);
  });

  return leaseList.map((lease, index) => {
    const item = itemById.get(String(lease?.device_id)) ?? {};
    const itemGroup = text(item.item_group);

    return {
      key: `${text(lease?.device_id)}-${text(lease?.subscription_initial_date)}-${index}`,
      deviceId: lease?.device_id,
      itemGroup,
      serialNumber: text(item.serial_number),
      cost: amount(item.cost),
      photo: photoByGroup.get(itemGroup) ?? null,
      assignedAt: lease?.subscription_initial_date ?? null,
      verificationId: lease?.verification_id ?? null,
      // `active: 0` on the lease means the unit is already back.
      isOut: lease?.active !== 0,
      lease,
      item,
    };
  });
}

/**
 * The at-a-glance numbers.
 *
 * `signedByVerification` maps a verification id to whether every document on it
 * is signed. A verification that has not loaded yet is absent from the map and
 * is not counted as pending: an unknown is not an alarm.
 */
export function summarizeStaffProfile({
  deviceRows,
  eventRows,
  signedByVerification,
} = {}) {
  const devices = Array.isArray(deviceRows) ? deviceRows : [];
  const events = Array.isArray(eventRows) ? eventRows : [];
  const signed = signedByVerification ?? {};

  const out = devices.filter((row) => row.isOut);
  const documentsPending = out.filter(
    (row) =>
      row.verificationId &&
      Object.prototype.hasOwnProperty.call(signed, row.verificationId) &&
      signed[row.verificationId] === false
  ).length;

  return {
    devicesOut: out.length,
    devicesTotal: devices.length,
    valueOut: out.reduce((total, row) => total + row.cost, 0),
    eventsActive: events.filter((row) => row.active).length,
    eventsTotal: events.length,
    documentsPending,
    hasPendingDocuments: documentsPending > 0,
  };
}

/** "Jun 1, 2026 · 10:00" — built by hand so an unparseable value says so. */
export function formatAssignedAt(value) {
  if (value === null || value === undefined || value === "") return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const day = `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;

  return `${day} · ${time}`;
}

/** A cost, as money. The column used to print a bare `$` plus the raw field. */
export function formatMoney(value) {
  return `$${amount(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
