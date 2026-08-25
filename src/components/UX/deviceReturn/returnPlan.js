/**
 * The rules behind returning devices in bulk, kept away from the markup.
 *
 * Three copies of this modal existed — `ExpressCheckoutItems`,
 * `ReturningInBulkMethod` and `ExpressCheckInDevices` — with the same two
 * endpoints and three different sets of small mistakes. The parts worth being
 * sure about live here so they can be tested once:
 *
 *  - which devices may be returned at all (the old express check-in was handed
 *    every row on the transaction, already-returned ones included, so scanning
 *    a serial that was back in inventory queued it to be returned again);
 *  - what a scan means (one warning covered "not on this transaction",
 *    "already back" and "already scanned", so the operator could not tell which
 *    of the three had happened);
 *  - the request bodies, which must not change: the endpoints read fields off
 *    the device records the caller passes in, so those objects travel through
 *    untouched.
 */

import { cleanScanValue } from "../../../utils/scan/scanInput";

const text = (value) => String(value ?? "").trim();

/** Serial numbers are text with a trailing counter — never numbers. */
const fold = (value) => text(value).toLowerCase();

/**
 * The same fold, for identifiers that can arrive from a hardware reader.
 *
 * `cleanScanValue` strips the reader's terminator and any configured
 * prefix/suffix before we compare (see ../../../config/scanning.js). Every knob
 * there is neutral today, so this is exactly the trim `fold` already did, plus
 * control characters. Stored serials go through it too: both sides of a
 * comparison have to be folded the same way. Case is still folded here rather
 * than in the scan config, because two inventory rows differing only by case
 * are legal app-wide.
 */
const foldScan = (value) => cleanScanValue(value).toLowerCase();

/**
 * A device can be returned only while it is out. `status` arrives as a boolean
 * from the receiver record, as the string "true" from a few legacy rows, and as
 * "lost" once it has been written off.
 */
export function isStillOut(device) {
  const status = device?.status;
  return status === true || fold(status) === "true";
}

/** Identity for the return list: the serial if there is one, else the record. */
export function isSameDevice(a, b) {
  const serialA = foldScan(a?.serialNumber);
  const serialB = foldScan(b?.serialNumber);
  if (serialA && serialB) return serialA === serialB;

  const idA = a?.key ?? a?.id ?? a?.receiverId;
  const idB = b?.key ?? b?.id ?? b?.receiverId;
  return Boolean(idA) && idA === idB;
}

/** A stable React key, so chips for two records do not collide on `undefined`. */
export function deviceKey(device, index) {
  return (
    device?.key ??
    device?.id ??
    device?.receiverId ??
    `${text(device?.serialNumber)}-${index}`
  );
}

/**
 * The devices on a transaction that are actually out, one row per physical unit.
 *
 * Handing a unit back and out again leaves two receiver records for one serial;
 * the newest wins, and the older duplicate is dropped so it cannot be returned
 * twice in the same request.
 */
export function returnableDevices(devices) {
  const list = Array.isArray(devices) ? devices : [];
  const seen = new Set();
  const result = [];

  list.forEach((device, index) => {
    if (!isStillOut(device)) return;
    const identity =
      foldScan(device?.serialNumber) ||
      `record:${device?.key ?? device?.id ?? device?.receiverId ?? index}`;
    if (seen.has(identity)) return;
    seen.add(identity);
    result.push(device);
  });

  return result;
}

/** Still out, and not yet on the return list. */
export function pendingDevices(devices, picked) {
  const chosen = Array.isArray(picked) ? picked : [];
  return returnableDevices(devices).filter(
    (device) => !chosen.some((item) => isSameDevice(item, device))
  );
}

/**
 * What happened when this serial was scanned: a code the UI can style on and a
 * sentence the operator can act on.
 */
export function resolveScan({ serial, devices, picked }) {
  // A reader's terminator and affixes come off before anything else, so a
  // mis-programmed reader degrades to a value we can still match.
  const scanned = cleanScanValue(serial);

  if (!scanned) {
    return {
      ok: false,
      code: "empty",
      serial: "",
      message: "Scan or type a serial number.",
    };
  }

  const chosen = Array.isArray(picked) ? picked : [];
  // `scanned` is already normalized; fold it once instead of re-cleaning it on
  // every comparison.
  const scannedKey = scanned.toLowerCase();
  if (chosen.some((item) => foldScan(item?.serialNumber) === scannedKey)) {
    return {
      ok: false,
      code: "duplicate",
      serial: scanned,
      message: `${scanned} is already on the return list.`,
    };
  }

  const matches = (Array.isArray(devices) ? devices : []).filter(
    (device) => foldScan(device?.serialNumber) === scannedKey
  );

  if (matches.length === 0) {
    return {
      ok: false,
      code: "not_found",
      serial: scanned,
      message: `${scanned} is not on this transaction.`,
    };
  }

  const out = matches.filter(isStillOut);
  if (out.length === 0) {
    return {
      ok: false,
      code: "already_returned",
      serial: scanned,
      message: `${scanned} is already back in inventory.`,
    };
  }

  // The newest record is the live one, and inventory's spelling of the serial
  // wins over whatever case it was typed in.
  const device = out.at(-1);
  return {
    ok: true,
    code: "ok",
    serial: text(device?.serialNumber),
    device,
    message: `${text(device?.serialNumber)} added to the return list.`,
  };
}

/** Progress of the return list against everything still out. */
export function summarizeReturn({ picked, returnable } = {}) {
  const chosen = Array.isArray(picked) ? picked.length : 0;
  const total = Array.isArray(returnable) ? returnable.length : 0;

  return {
    picked: chosen,
    total,
    remaining: Math.max(total - chosen, 0),
    isComplete: total > 0 && chosen >= total,
    // Nothing selected is not a return. The old confirm button read
    // "Total items to return: 0" and sent the request anyway.
    canSubmit: chosen > 0,
  };
}

/**
 * The bodies for `/receiver/update-bulk-items-in-transaction` and
 * `/receiver/update-bulk-items-in-pool`, unchanged from what they accept today.
 */
export function buildBulkReturnPayloads({
  devices,
  companyId,
  eventSelected,
  timeStamp,
}) {
  const list = Array.isArray(devices) ? devices : [];

  return {
    transaction: { timeStamp, device: list },
    pool: {
      device: list,
      company: companyId,
      activity: false,
      eventSelected,
    },
  };
}

/**
 * The cached device lists a return invalidates. The event is addressed by name
 * on some keys and by id on others, and a partially built event object carries
 * only some of them — an absent id used to be written into the key as the
 * literal string "undefined".
 */
export function returnCacheKeys({ event, companyId }) {
  const ids = [event?.eventInfoDetail?.eventName, event?.id, event?.eventInfoDetail?.id];

  return Array.from(new Set(ids.filter(Boolean))).map(
    (id) => `eventSelected=${id}&company=${companyId}`
  );
}
