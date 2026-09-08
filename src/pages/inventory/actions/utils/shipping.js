/**
 * Shipping inventory out to an event, and the record it leaves behind.
 *
 * The two screens that use this shared no logic: the shipment payload was
 * assembled inline in a click handler, the courier tracking URLs were a `switch`
 * nested two levels deep inside a table cell renderer, and the status vocabulary
 * lived in two constants at the top of one file that had drifted out of step
 * with the values the queries actually ask for.
 *
 * None of this changes a request. `buildShipmentPayload` exists precisely to
 * pin the body `POST /api/db_shipment` already accepts.
 */

const text = (value) => String(value ?? "").trim();

/* ─────────────────────────────────────────────────────── shipping status ── */

/**
 * How a shipping status reads on screen.
 *
 * `locked_in_warehouse` is the status both queries in the ship-out modal search
 * for, and it was missing from the label map — so every row in the packing list
 * rendered its status as an em dash. `in-transit` is what the ship-out writes
 * and was missing too.
 */
export const SHIPPING_STATUS = {
  locked_in_warehouse: { label: "Ready to ship", tone: "warning" },
  "in-reserved": { label: "Reserved", tone: "neutral" },
  "in-transit": { label: "In transit", tone: "action" },
  shipped: { label: "Shipped", tone: "success" },
  delivered: { label: "Delivered", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
};

export function describeShippingStatus(status) {
  const key = text(status);
  return SHIPPING_STATUS[key] ?? { label: key || "—", tone: "neutral" };
}

/* ─────────────────────────────────────────────────────────── tracking ───── */

const TRACKING_URLS = {
  ups: (n) => `https://www.ups.com/track?track=yes&trackNums=${n}`,
  usps: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`,
  fedex: (n) => `https://www.fedex.com/fedextrack/?trknbr=${n}`,
  dhl: (n) => `https://www.dhl.com/en/express/tracking.html?AWB=${n}`,
};

/** The carrier's tracking page, or null when we do not know the carrier. */
export function trackingUrl(courier, trackingNumber) {
  const number = text(trackingNumber);
  const carrier = text(courier).toLowerCase();
  if (!number || !carrier) return null;

  const build = TRACKING_URLS[carrier];
  return build ? build(encodeURIComponent(number)) : null;
}

/* ───────────────────────────────────────────────────────────── events ───── */

/**
 * The distinct events represented by a flat list of event-items.
 *
 * The endpoint answers with one row per item, so the selector needs them
 * collapsed. Also counts the items per event, which the old selector did not —
 * so you picked an event without knowing whether it had 3 items or 300.
 */
export function eventsFromItems(items) {
  const list = Array.isArray(items) ? items : [];
  const byId = new Map();

  list.forEach((item) => {
    const id = item?.event_id;
    if (id === undefined || id === null) return;

    const existing = byId.get(id);
    if (existing) {
      existing.itemCount += 1;
      return;
    }
    byId.set(id, {
      id,
      label: text(item?.event_name) || `Event ${id}`,
      address: text(item?.event_address),
      eventDate: item?.event_date ?? null,
      itemCount: 1,
      rawData: item,
    });
  });

  return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label));
}

/* ──────────────────────────────────────────────────────────── the form ─── */

/**
 * The fields `POST /api/db_shipment` will not accept the request without,
 * paired with the label the form shows for each.
 *
 * Taken from the generated contract (`src/docs/api-payloads.md`): the endpoint
 * requires authorizer_name, company_id, courier, destination, event_id,
 * recipient_name and tracking_number.
 */
export const SHIPMENT_FIELDS = [
  { key: "destination", label: "Destination" },
  { key: "courier", label: "Courier" },
  { key: "trackingNumber", label: "Tracking number" },
  { key: "authorizer", label: "Authorised by" },
  { key: "receiver", label: "Received by" },
];

/** Which required fields are still empty. Empty array means ready to send. */
export function missingShipmentFields(form) {
  return SHIPMENT_FIELDS.filter((field) => !text(form?.[field.key])).map(
    (field) => field.key
  );
}

/**
 * The body of `POST /api/db_shipment`, unchanged.
 *
 * Note what is NOT here: the ship-out date. The form asks for it, refuses to
 * submit without it and prints it on the packing report, but the endpoint has
 * no field for it — so it has never been stored. Adding one is a server change,
 * so the form now says the date is for the report; see
 * FRONTEND_api_payload_answers.md.
 */
export function buildShipmentPayload({
  authorizer,
  companyId,
  courier,
  destination,
  eventId,
  packageList,
  receiver,
  trackingNumber,
}) {
  return {
    authorizer_name: text(authorizer),
    company_id: companyId,
    courier: text(courier),
    destination: text(destination),
    event_id: eventId,
    package_list: Array.isArray(packageList) ? packageList : [],
    recipient_name: text(receiver),
    status: "pending",
    tracking_number: text(trackingNumber),
  };
}

/* ───────────────────────────────────────────────────────────── display ─── */

/** "Jun 1, 2026, 10:00" — the readable form for a report and a table cell. */
export function formatShipmentDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-US", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Shipment rows matching a free-text search over what the table shows. */
export function filterShipments(rows, search) {
  const term = text(search).toLowerCase();
  const list = Array.isArray(rows) ? rows : [];
  if (!term) return list;

  return list.filter((row) =>
    [
      row?.destination,
      row?.recipient_name,
      row?.authorizer_name,
      row?.courier,
      row?.tracking_number,
    ].some((value) => text(value).toLowerCase().includes(term))
  );
}
