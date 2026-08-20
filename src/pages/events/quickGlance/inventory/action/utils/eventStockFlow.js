/**
 * Adding company stock to an event, as a three-step flow.
 *
 * Every label the wizard renders lives here, because the labels ARE the
 * redesign. What the old modal did instead:
 *
 * - It offered a single antd Select whose options were JSX cramming
 *   `CATEGORY group | Location | Available` into one line, and searched over
 *   that JSX (`optionFilterProp="children"`), so search barely worked.
 *   `buildStockRows` turns the same response into rows, and
 *   `filterStockRows` searches the three real fields.
 * - It asked for a starting serial and a quantity and committed without ever
 *   showing which serials that resolved to. The submit already resolves the run
 *   server-side through the read-only `inventory.assignableFromSerial` query, so
 *   `describeRangePreview` renders that same read made earlier — no new
 *   endpoint, no payload change.
 * - It reported a partial scan as a whole success. `describeScanList` names the
 *   serials that will be skipped before anything is written.
 *
 * Nothing here builds or pads a serial: the server expands every range.
 */

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

const isFilledString = (value) => typeof value === "string" && value.trim() !== "";

const asArray = (value) => (Array.isArray(value) ? value : []);

const asKey = (value) => String(value ?? "").trim();

const asPositiveInt = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const floored = Math.floor(parsed);
  return floored > 0 ? floored : null;
};

const STEP_LABELS = [
  { id: "1", label: "Pick stock" },
  { id: "2", label: "How many" },
  { id: "3", label: "Review" },
];

/**
 * Flattens `groupedInventory` from
 * `POST /db_event/retrieve-item-group-location-quantity` — category → item
 * group → location → available count — into one row per location.
 *
 * @param {object} groupedInventory
 * @returns {Array<{id: string, category: string, group: string,
 *   location: string, qty: number}>}
 */
export const buildStockRows = (groupedInventory) => {
  if (
    !groupedInventory ||
    typeof groupedInventory !== "object" ||
    Array.isArray(groupedInventory)
  ) {
    return [];
  }

  const rows = [];
  Object.entries(groupedInventory).forEach(([category, groups]) => {
    if (!groups || typeof groups !== "object") return;
    Object.entries(groups).forEach(([group, locations]) => {
      if (!locations || typeof locations !== "object") return;
      Object.entries(locations).forEach(([location, quantity]) => {
        // A location with no readable count has nothing to offer. Reject the
        // empty values before Number(), which turns null and "" into 0 — a
        // finite number that would sail through the check below as "0 available".
        if (quantity === null || quantity === undefined || quantity === "") return;
        const qty = Number(quantity);
        if (!Number.isFinite(qty)) return;
        rows.push({
          id: `${category}||${group}||${location}`,
          category,
          group,
          location,
          qty: Math.floor(qty),
        });
      });
    });
  });
  return rows;
};

/**
 * Narrows the rows by a free-text query, matched against the group, the
 * category and the location — every whitespace-separated term must match
 * somewhere, so "receiver vegas" finds the Las Vegas receivers.
 *
 * @param {Array<object>} rows
 * @param {string} query
 * @returns {Array<object>} the same row objects, filtered.
 */
export const filterStockRows = (rows, query) => {
  const list = asArray(rows);
  if (!isFilledString(query)) return list;

  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return list.filter((row) => {
    const haystack = `${row?.group ?? ""} ${row?.category ?? ""} ${row?.location ?? ""}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
};

/**
 * The verdict on a consecutive run, from what the server resolved.
 *
 * @param {{startSerial?: string, requestedQty?: unknown,
 *   resolvedSerials?: Array<string>, startExists?: boolean,
 *   checking?: boolean}} args
 * @returns {{tone: "idle"|"good"|"warn"|"bad", headline: string,
 *   countLabel: string, note: string|null, serials: Array<string>}}
 */
export const describeRangePreview = (args) => {
  const { startSerial, requestedQty, resolvedSerials, startExists, checking } = args ?? {};
  const start = asKey(startSerial);
  const wanted = asPositiveInt(requestedQty);

  const idle = (headline) => ({
    tone: "idle",
    headline,
    countLabel: "—",
    note: null,
    serials: [],
  });

  if (start === "" || wanted === null) {
    return idle("Fill both fields to see the serials");
  }
  if (checking) return idle("Checking this location…");

  const resolved = asArray(resolvedSerials).map(String);

  if (resolved.length === 0) {
    // Either the starting serial is not here at all, or it is the last one and
    // nothing follows it. Both mean nothing can be added from it.
    return {
      tone: "bad",
      headline:
        startExists === true
          ? "Nothing available from that serial onward"
          : "That serial is not in this location",
      countLabel: "0 found",
      note:
        startExists === true
          ? "That is the last matching device in this location. Start further back, or pick different stock."
          : "It may belong to another location or another item group. Check the serial, or pick different stock.",
      serials: [],
    };
  }

  if (resolved.length < wanted) {
    return {
      tone: "warn",
      headline: "Fewer available than asked for",
      countLabel: `${resolved.length} of ${wanted}`,
      note: `Only ${plural(
        resolved.length,
        "consecutive device",
      )} from ${start} onward. Adding will take those; lower the quantity or start further back.`,
      serials: resolved,
    };
  }

  return {
    tone: "good",
    headline: "These devices will be added",
    countLabel: `${resolved.length} of ${wanted}`,
    note: null,
    serials: resolved,
  };
};

/**
 * Each scanned serial checked against what this location actually holds, so an
 * unmatched one is flagged as it is added rather than dropped silently at save.
 *
 * @param {Array<string>} scanned what the user scanned or typed, in order.
 * @param {Array<string>|null} matchedSerials what the server resolved, or null
 *   while that read is still in flight.
 * @returns {{rows: Array<{serial: string, ok: boolean|null}>,
 *   goodSerials: Array<string>, badSerials: Array<string>,
 *   summary: string, rejectMessage: string|null}}
 */
export const describeScanList = (scanned, matchedSerials) => {
  const list = asArray(scanned).map(asKey).filter((s) => s !== "");
  const pending = !Array.isArray(matchedSerials);

  if (list.length === 0) {
    return {
      rows: [],
      goodSerials: [],
      badSerials: [],
      summary: "Nothing scanned yet",
      rejectMessage: null,
    };
  }

  if (pending) {
    return {
      rows: list.map((serial) => ({ serial, ok: null })),
      goodSerials: [],
      badSerials: [],
      summary: `${list.length} scanned, checking this location…`,
      rejectMessage: null,
    };
  }

  const matched = new Set(asArray(matchedSerials).map(asKey));
  const rows = list.map((serial) => ({ serial, ok: matched.has(serial) }));
  const goodSerials = rows.filter((r) => r.ok).map((r) => r.serial);
  const badSerials = rows.filter((r) => !r.ok).map((r) => r.serial);

  const one = badSerials.length === 1;
  return {
    rows,
    goodSerials,
    badSerials,
    summary: `${goodSerials.length} of ${list.length} found in this location`,
    rejectMessage:
      badSerials.length === 0
        ? null
        : `${plural(badSerials.length, "serial")} ${
            one ? "was" : "were"
          } not found here and will be skipped: ${badSerials.join(", ")}. Remove ${
            one ? "it" : "them"
          }, or add ${one ? "it" : "them"} anyway and only the rest goes in.`,
  };
};

/**
 * The review step: exactly what the write will carry, before it is sent.
 *
 * @param {{picked: object|null, serials: Array<string>, deposit: unknown}} args
 * @returns {Array<{label: string, value: string}>} always the same five rows.
 */
export const buildReviewRows = (args) => {
  const { picked, serials, deposit } = args ?? {};
  const list = asArray(serials).map(String);
  const depositRaw = asKey(deposit);

  const groupValue = picked
    ? `${picked.category ?? "—"} · ${picked.group ?? "—"}`
    : "—";

  let rangeValue = "—";
  if (list.length === 1) rangeValue = list[0];
  else if (list.length > 1) rangeValue = `${list[0]} → ${list[list.length - 1]}`;

  return [
    { label: "Item group", value: groupValue },
    { label: "Location", value: picked?.location ?? "—" },
    { label: "Devices", value: `${list.length} of ${picked?.qty ?? 0} available` },
    { label: "Serial range", value: rangeValue },
    { label: "Deposit per device", value: depositRaw === "" ? "None" : depositRaw },
  ];
};

/**
 * The stepper. Only a completed step can be revisited — jumping forward would
 * skip the pick the later steps depend on.
 *
 * @param {string} step "1" | "2" | "3" | "done"
 * @returns {Array<{id: string, label: string, badge: string,
 *   state: "done"|"current"|"upcoming", canRevisit: boolean}>}
 */
export const describeStepper = (step) => {
  const ids = STEP_LABELS.map((s) => s.id);
  const currentIndex = step === "done" ? ids.length : Math.max(0, ids.indexOf(step));

  return STEP_LABELS.map((entry, index) => {
    const state =
      index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming";
    return {
      id: entry.id,
      label: entry.label,
      badge: state === "done" ? "done" : String(index + 1),
      state,
      canRevisit: state === "done",
    };
  });
};

/**
 * The footer: one primary action per step, named after what it does.
 *
 * @param {{step: string, count: number, hasPicked?: boolean,
 *   submitting?: boolean}} args
 * @returns {{nextLabel: string, nextDisabled: boolean, hint: string,
 *   showBack: boolean, showAddAnother: boolean}}
 */
export const describeWizardFooter = (args) => {
  const { step, count, hasPicked, submitting } = args ?? {};
  const total = Number.isFinite(Number(count)) ? Math.max(0, Math.floor(Number(count))) : 0;

  if (step === "done") {
    return {
      nextLabel: "Done",
      nextDisabled: false,
      hint: "",
      showBack: false,
      showAddAnother: true,
    };
  }

  // The three inserts carry no dedup key, so a second submit writes the same
  // devices again (the defect fixed once in commit 95a61580).
  const busyHint = "Do not submit again — a second run would add these devices twice.";

  if (step === "3") {
    return {
      nextLabel: `Add ${plural(total, "device")} to this event`,
      nextDisabled: Boolean(submitting) || total === 0,
      hint: submitting ? busyHint : "Last chance to change anything",
      showBack: !submitting,
      showAddAnother: false,
    };
  }

  if (step === "2") {
    return {
      nextLabel: `Review ${plural(total, "device")}`,
      nextDisabled: total === 0,
      hint: "Nothing is written until you confirm",
      showBack: true,
      showAddAnother: false,
    };
  }

  return {
    nextLabel: "Continue",
    nextDisabled: !hasPicked,
    hint: "Pick the stock you want to add",
    showBack: false,
    showAddAnother: false,
  };
};
