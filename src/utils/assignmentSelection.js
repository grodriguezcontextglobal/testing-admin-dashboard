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

const text = (value) => String(value ?? "").trim();

/** Serial numbers are text with a trailing counter — never numbers. */
const fold = (value) => text(value).toLowerCase();

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
  const scanned = text(serial);

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

/**
 * Whether the address can be accepted as typed.
 *
 * Answering is voluntary: the field asks where a device will be kept, and the
 * honest answer is usually the school's own address, or — for a device going
 * home with a child — a family's home address that nothing in the product ever
 * reads back. Holding it because a form insisted is the kind of collection
 * worth not doing.
 *
 * Optional is not unchecked, though. A half-typed address looks like a record
 * and cannot be delivered to, so it is all four fields or none. And the zip has
 * to contain a digit: the gate this replaces was satisfied by a single letter
 * in every field, which is how "F, F, F" got accepted during the review.
 */
export function isAddressUsable(address) {
  const fields = ["street", "city", "state", "zip"];
  const filled = fields.filter((field) => Boolean(text(address?.[field])));
  if (filled.length === 0) return true;
  if (filled.length < fields.length) return false;
  return /\d/.test(text(address?.zip));
}

/**
 * The inventory group that holds a given device, or null.
 *
 * Assigning from a device's own page hands the staff flow a serial and expects
 * its group to be selected already. Category and group alone are not enough to
 * identify one — the same model sits in several locations — so the location
 * narrows it. When the device carries no location, category and group are
 * accepted only if exactly one group matches: picking the wrong one would load
 * the wrong shelf's serials and quietly hand over a different unit.
 */
export function findOptionForDevice(options, device) {
  const list = Array.isArray(options) ? options : [];
  if (!device || list.length === 0) return null;

  const category = text(device.category_name);
  const group = text(device.item_group);
  const location = text(device.location);

  const sameGroup = list.filter(
    (option) =>
      text(option.category_name) === category && text(option.item_group) === group
  );
  if (sameGroup.length === 0) return null;

  if (location) {
    return sameGroup.find((option) => text(option.location) === location) ?? null;
  }
  return sameGroup.length === 1 ? sameGroup[0] : null;
}
