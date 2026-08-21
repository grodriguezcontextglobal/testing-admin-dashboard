/**
 * Validating a scanned serial against the event's device pool.
 *
 * This replaces the "starting serial + quantity" model the multi-device
 * transaction screens used, which resolved a request by index arithmetic:
 *
 *     const i = pool.findIndex((el) => el.device === data.startingNumber);
 *     if (Number(i) > -1) { ...assign pool.slice(i, i + qty)... }
 *     await devitrakApi.post("/stripe/save-transaction", profile);
 *
 * Three things were wrong with that. It never checked `activity`, so a blind
 * slice could hand out units already out with another consumer. It never checked
 * that `qty` devices actually existed past that index, so it could quietly
 * assign fewer. And it had no `else`: a starting serial that was not found
 * skipped the assignment entirely but still saved the transaction, leaving a
 * transaction that claims N devices and holds none — with no error shown.
 *
 * Every serial is now checked individually, before anything is written.
 */

import { sortSerials } from "./serialRange";

const normalize = (value) => String(value ?? "").trim();
const key = (value) => normalize(value).toLowerCase();

const isLost = (record) => key(record?.status) === "lost";
const isOut = (record) => Boolean(record?.activity);

/** The serials of one device type that are free to hand out right now. */
export function availableSerialsForGroup(pool, group) {
  const wanted = key(group);
  if (!wanted) return [];

  const serials = (Array.isArray(pool) ? pool : [])
    .filter(
      (record) => key(record?.type) === wanted && !isOut(record) && !isLost(record)
    )
    .map((record) => normalize(record?.device))
    .filter(Boolean);

  return sortSerials(Array.from(new Set(serials)));
}

/**
 * What happened when this serial was scanned. Returns a code the UI can style
 * on and a sentence the operator can act on — never a bare boolean, because
 * "rejected" and "rejected because it is already out with bay 4" are different
 * amounts of help.
 */
export function describeScan({ serial, pool, group, picked, quantity }) {
  const scanned = normalize(serial);

  if (!group) {
    return {
      ok: false,
      code: "no_group",
      serial: scanned,
      message: "Choose a device type before scanning.",
    };
  }

  if (!scanned) {
    return {
      ok: false,
      code: "empty",
      serial: "",
      message: "Scan or type a serial number.",
    };
  }

  const alreadyPicked = (Array.isArray(picked) ? picked : []).map(key);
  if (alreadyPicked.includes(key(scanned))) {
    return {
      ok: false,
      code: "duplicate",
      serial: scanned,
      message: `${scanned} is already on this transaction.`,
    };
  }

  const target = Number(quantity) || 1;
  if (alreadyPicked.length >= target) {
    return {
      ok: false,
      code: "complete",
      serial: scanned,
      message: `All ${target} device${target === 1 ? "" : "s"} are scanned. Remove one to swap it.`,
    };
  }

  const records = (Array.isArray(pool) ? pool : []).filter(
    (record) => key(record?.device) === key(scanned)
  );

  if (records.length === 0) {
    return {
      ok: false,
      code: "not_found",
      serial: scanned,
      message: `${scanned} is not in this event's inventory.`,
    };
  }

  const ofGroup = records.filter((record) => key(record?.type) === key(group));
  if (ofGroup.length === 0) {
    const actual = normalize(records.at(-1)?.type) || "another type";
    return {
      ok: false,
      code: "wrong_type",
      serial: scanned,
      message: `${scanned} is a ${actual}, not a ${normalize(group)}.`,
    };
  }

  // Any record in use or written off disqualifies the serial: the duplicate
  // rows are the same physical unit.
  if (ofGroup.some(isLost)) {
    return {
      ok: false,
      code: "lost",
      serial: scanned,
      message: `${scanned} is written off as lost and cannot be assigned.`,
    };
  }
  if (ofGroup.some(isOut)) {
    return {
      ok: false,
      code: "in_use",
      serial: scanned,
      message: `${scanned} is already out with another consumer.`,
    };
  }

  const record = ofGroup.at(-1);
  return {
    ok: true,
    code: "ok",
    // The pool's spelling wins, so what gets written matches inventory even if
    // the serial was typed in a different case.
    serial: normalize(record.device),
    device: record,
    message: `${normalize(record.device)} added.`,
  };
}

/** Progress of the scan against what the transaction asked for. */
export function summarizeSelection({ picked, quantity }) {
  const count = (Array.isArray(picked) ? picked : []).length;
  const target = Number(quantity) || 1;

  return {
    picked: count,
    quantity: target,
    remaining: Math.max(target - count, 0),
    isComplete: count >= target,
    canSubmit: count > 0 && count >= target,
  };
}
