/**
 * Checking devices back into the warehouse after an event.
 *
 * The screen reconciles two lists: what the event is holding, and what the
 * operator physically scanned off the pallet. All of that used to live inside
 * the component, and the comparison was frozen into state behind a "Compare"
 * button — so scanning more devices after pressing it left the results stale
 * and the check-in posted the earlier, smaller set. Deriving it here means the
 * comparison cannot go out of date.
 *
 * Nothing here changes a request. `buildCheckInPayload` exists to pin the body
 * `POST /api/db_event/confirm-item-return` already accepts.
 */

const text = (value) => String(value ?? "").trim();

const unique = (values) => Array.from(new Set(values));

/* ────────────────────────────────────────────────────────── the two lists ── */

/** The serials this event is waiting on, each one once. */
export function expectedSerials(eventInventory) {
  const list = Array.isArray(eventInventory) ? eventInventory : [];
  return unique(list.map((item) => text(item?.device)).filter(Boolean));
}

/**
 * A scan added to the list.
 *
 * Returns why nothing happened when nothing happened: a re-scan used to be
 * dropped in silence, which on a scanner gun is indistinguishable from a
 * trigger that did not fire.
 */
export function addScannedSerial(scanned, raw) {
  const list = Array.isArray(scanned) ? scanned : [];
  const serial = text(raw);

  if (!serial) return { list, outcome: "empty", serial };
  if (list.includes(serial)) return { list, outcome: "duplicate", serial };

  // Newest first: the operator is looking at the top of the list, not the end.
  return { list: [serial, ...list], outcome: "added", serial };
}

/* ─────────────────────────────────────────────────────────── reconciling ── */

/**
 * The scans split three ways against the event's inventory.
 *
 * `matched` is what gets checked in, and it is built from the scanned strings —
 * exactly as before, so the serials sent are the ones the server stores.
 */
export function reconcile(eventInventory, scanned) {
  const expected = expectedSerials(eventInventory);
  const expectedSet = new Set(expected);
  const scans = unique((Array.isArray(scanned) ? scanned : []).map(text).filter(Boolean));
  const scannedSet = new Set(scans);

  return {
    matched: scans.filter((serial) => expectedSet.has(serial)),
    missing: expected.filter((serial) => !scannedSet.has(serial)),
    extra: scans.filter((serial) => !expectedSet.has(serial)),
  };
}

/**
 * The event serial that differs from this scan only in casing, if there is one.
 *
 * The match itself stays exact — sending a serial in a casing the server does
 * not store would fail there instead of here. This just lets the screen say
 * "did you mean…" rather than filing an obviously-correct scan as an extra.
 */
export function nearMiss(eventInventory, raw) {
  const serial = text(raw);
  if (!serial) return null;

  const expected = expectedSerials(eventInventory);
  if (expected.includes(serial)) return null;

  const lower = serial.toLowerCase();
  return expected.find((candidate) => candidate.toLowerCase() === lower) ?? null;
}

const STATUS_ORDER = { missing: 0, extra: 1, scanned: 2 };

/**
 * One row per device, expected and unexpected alike, ready for the table.
 *
 * The old screen showed the event inventory as a collapsible tree on the left
 * and the scans as a cloud of chips on the right, with no way to tell which of
 * the 300 leaves on the left had been ticked off. This is the same information
 * as one list you can read.
 */
export function reconciliationRows(eventInventory, scanned) {
  const list = Array.isArray(eventInventory) ? eventInventory : [];
  const { extra } = reconcile(eventInventory, scanned);
  const scannedSet = new Set(
    (Array.isArray(scanned) ? scanned : []).map(text).filter(Boolean)
  );

  const seen = new Set();
  const rows = [];

  list.forEach((item) => {
    const serial = text(item?.device);
    if (!serial || seen.has(serial)) return;
    seen.add(serial);

    rows.push({
      key: `expected-${serial}`,
      serial,
      type: text(item?.type) || "—",
      status: scannedSet.has(serial) ? "scanned" : "missing",
    });
  });

  extra.forEach((serial) => {
    rows.push({ key: `extra-${serial}`, serial, type: "—", status: "extra" });
  });

  // Still-missing first: that is the pile the operator is still looking for.
  return rows.sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      a.serial.localeCompare(b.serial)
  );
}

/* ──────────────────────────────────────────────────────────── the request ── */

/**
 * The body of `POST /api/db_event/confirm-item-return`, unchanged.
 *
 * The contract requires company_id, noSqlEventName and user_id, and accepts
 * location, noSqlCompanyId, serial_numbers and sub_location. Nothing else is
 * sent; see src/docs/api-payloads.md.
 */
export function buildCheckInPayload({
  companyId,
  eventName,
  location,
  matched,
  noSqlCompanyId,
  subLocations,
  userId,
}) {
  return {
    company_id: companyId,
    location: location ?? null,
    noSqlCompanyId: noSqlCompanyId ?? null,
    noSqlEventName: eventName ?? null,
    serial_numbers: Array.isArray(matched) ? matched : [],
    sub_location: subLocations ? Array.from(subLocations) : [],
    user_id: userId ?? null,
  };
}

/**
 * Why the check-in cannot run yet, in the operator's words.
 *
 * The old form answered one blocker at a time with a toast, and hid the button
 * entirely for the third — so the most common wait had nothing explaining it.
 */
export function checkInBlockers({ eventName, location, matchedCount } = {}) {
  const blockers = [];
  if (!eventName) blockers.push("Pick the event the devices came back from.");
  if (!location) blockers.push("Pick where the devices are being stored.");
  if (!matchedCount) {
    blockers.push("Scan at least one device that belongs to this event.");
  }
  return blockers;
}
