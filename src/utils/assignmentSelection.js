/**
 * Choosing which units to hand to a staff member.
 *
 * This replaces the "starting serial number + quantity" model the form used,
 * which resolved a selection by index arithmetic:
 *
 *     const index = list.findIndex((i) => i.serial_number === data.startingNumber);
 *     if (index > -1) { ...assign list.slice(index, index + Number(data.quantity))... }
 *
 * Three things were wrong with it. A blind slice returns fewer rows than asked
 * for whenever the range runs out, and the form assigned them anyway without
 * saying so. Each of the three nested `if`s had no `else`, so a serial that was
 * not found did nothing at all — the spinner cleared in `finally` and no message
 * was shown either way. And the ✓/✗ next to the field was driven by an effect
 * that only re-evaluated when the typed length equalled the first serial's
 * length, so a valid serial of a different length left the submit button
 * disabled.
 *
 * Units are now picked one at a time, or all at once, from the list that was
 * actually fetched — the same model the return and check-in flows use.
 */

import { cleanScanValue } from "./scan/scanInput";

const text = (value) => String(value ?? "").trim();

/**
 * An identifier as it arrives from the field.
 *
 * The reader's terminator and any affixes it is programmed to wrap a read in
 * come off here (knobs live in src/config/scanning.js), so a hardware read and
 * a typed one reach the comparison in the same shape — which is what lets a
 * 24-hex-character EPC and a short printed serial share one input. Config is
 * neutral today, so this is `text()` plus control-character stripping.
 *
 * Identifiers only. The address fields keep using `text()`: they are free text
 * and must never be rewritten by a reader setting.
 */
const scan = (value) => cleanScanValue(value);

/**
 * Serial numbers are text with a trailing counter — never numbers. Case is
 * folded here on purpose, on top of whatever SCAN_CASE_MODE did: two rows that
 * differ only by case are the same unit as far as this screen is concerned.
 */
const fold = (value) => scan(value).toLowerCase();

/**
 * The category → item → location tree the warehouse endpoint returns, flattened
 * into one selectable row per location.
 */
export function buildInventoryOptions(groupedInventory) {
  const tree = groupedInventory ?? {};
  const options = [];

  Object.entries(tree).forEach(([categoryName, categoryData]) => {
    Object.entries(categoryData ?? {}).forEach(([itemGroup, itemData]) => {
      Object.entries(itemData ?? {}).forEach(([location, quantity]) => {
        const total = Number(quantity) || 0;
        options.push({
          key: `${categoryName}|${itemGroup}|${location}`,
          category_name: categoryName,
          item_group: itemGroup,
          location,
          total,
          // The selector's value has to be a primitive, and the caller needs
          // every part of it back to query the serials.
          value: JSON.stringify({
            category_name: categoryName,
            item_group: itemGroup,
            location,
            quantity: total,
          }),
        });
      });
    });
  });

  return options.sort(
    (a, b) =>
      a.category_name.localeCompare(b.category_name) ||
      a.item_group.localeCompare(b.item_group) ||
      a.location.localeCompare(b.location)
  );
}

/** The units still available to pick: fetched, minus what is already picked. */
export function remainingUnits(available, picked) {
  const chosen = (Array.isArray(picked) ? picked : []).map((unit) =>
    fold(unit?.serial_number)
  );
  return (Array.isArray(available) ? available : []).filter(
    (unit) => !chosen.includes(fold(unit?.serial_number))
  );
}

/**
 * What happened when this serial was typed or scanned: a code the UI can style
 * on and a sentence the operator can act on.
 */
export function resolveSerialScan({ serial, available, picked }) {
  const scanned = scan(serial);

  if (!scanned) {
    return {
      ok: false,
      code: "empty",
      serial: "",
      message: "Scan or type a serial number.",
    };
  }

  if (!Array.isArray(available) || available.length === 0) {
    return {
      ok: false,
      code: "no_group",
      serial: scanned,
      message: "Choose a device and location first.",
    };
  }

  const chosen = Array.isArray(picked) ? picked : [];
  if (chosen.some((unit) => fold(unit?.serial_number) === fold(scanned))) {
    return {
      ok: false,
      code: "duplicate",
      serial: scanned,
      message: `${scanned} is already on this assignment.`,
    };
  }

  const match = available.find(
    (unit) => fold(unit?.serial_number) === fold(scanned)
  );
  if (!match) {
    return {
      ok: false,
      code: "not_found",
      serial: scanned,
      message: `${scanned} is not available in this location.`,
    };
  }

  return {
    ok: true,
    code: "ok",
    // Inventory's spelling wins, so what gets written matches the record even
    // if the serial was typed in a different case.
    serial: text(match.serial_number),
    unit: match,
    message: `${text(match.serial_number)} added.`,
  };
}

/** Progress of the pick against what the location holds. */
export function summarizePick({ picked, available } = {}) {
  const chosen = Array.isArray(picked) ? picked.length : 0;
  const total = Array.isArray(available) ? available.length : 0;

  return {
    picked: chosen,
    available: total,
    remaining: Math.max(total - chosen, 0),
    isComplete: total > 0 && chosen >= total,
    canSubmit: chosen > 0,
  };
}

/** The address the lease and the generated event record are stamped with. */
export function isAddressComplete(address) {
  return ["street", "city", "state", "zip"].every((field) =>
    Boolean(text(address?.[field]))
  );
}
