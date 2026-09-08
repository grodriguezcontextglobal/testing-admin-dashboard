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

/**
 * A whole pass added at once.
 *
 * `addScannedSerial` is one trigger pull, and it checks the list it already has
 * with `includes()` — fine for a hand scanner, quadratic for a bulk read:
 * filing 500 devices one call at a time is 125,000 string comparisons. A bulk
 * reader hands over the whole pallet in one go, so this walks the batch once
 * against a Set.
 *
 * Repeats are expected rather than wrong. The reader hears the same tag dozens
 * of times per pass, and a device can be read again on a second sweep, so
 * `duplicates` is information for the summary line, not a warning per item.
 *
 * @returns {{list: string[], added: string[], duplicates: string[], empty: number}}
 *   `list` keeps the newest-first order of the single version, so the operator
 *   is still reading the top of the list.
 */
export function addScannedSerials(scanned, incoming) {
  const list = Array.isArray(scanned) ? scanned : [];
  const batch = Array.isArray(incoming) ? incoming : [];

  const seen = new Set(list.map(text).filter(Boolean));
  const added = [];
  const duplicates = [];
  let empty = 0;

  batch.forEach((raw) => {
    const serial = text(raw);
    if (!serial) {
      empty += 1;
      return;
    }
    if (seen.has(serial)) {
      duplicates.push(serial);
      return;
    }
    seen.add(serial);
    added.push(serial);
  });

  return { list: [...added].reverse().concat(list), added, duplicates, empty };
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

/**
 * The count reported when an event closes.
 *
 * One object rather than four `.length` reads spread through the screen, so the
 * number on the tile, the number in the sentence and the number that would be
 * recorded against the event cannot disagree.
 *
 * `counted` is everything physically found — matched plus extra. A device from
 * another event was on the pallet and was counted; it just cannot close a line
 * on this one.
 *
 * `complete` needs at least one count. Nothing expected and nothing scanned is
 * a screen nobody used, not a finished reconciliation, and calling it complete
 * would file a closed event that was never checked.
 */
export function countSummary(eventInventory, scanned) {
  const { matched, missing, extra } = reconcile(eventInventory, scanned);
  const expected = expectedSerials(eventInventory).length;
  const counted = matched.length + extra.length;

  return {
    expected,
    counted,
    matched: matched.length,
    missing: missing.length,
    extra: extra.length,
    complete: counted > 0 && missing.length === 0,
  };
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
