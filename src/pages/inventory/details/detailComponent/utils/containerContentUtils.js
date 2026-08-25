/**
 * Packing and unpacking a container ("case") on the device profile.
 *
 * Every label the two container components render comes from here, because the
 * whole point of the redesign is what those labels say:
 *
 * - Capacity used to be a fragment inside a sentence — `| 8/12 cap`. It is a
 *   meter now, and `tone` is the single decision the number, the fill bar and
 *   the status pill all read from.
 * - `containerSpotLimit` is seeded as the string `"0"` by every create form
 *   (`useBulkActionLogic`, `BulkRentedItemsActions`), so a great many real
 *   containers carry no usable limit and the old header rendered `8/0 cap`.
 *   A zero, negative, blank or unparseable limit means NO limit here — never a
 *   full case, which would wrongly block saving.
 * - Changes stage locally and are described before they are committed, so the
 *   save can be one full-replace call instead of the DELETE-then-POST the old
 *   `savingItemsInContainer` did (a failed POST there left the case emptied
 *   with nothing to put back).
 */

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

const isFilledString = (value) => typeof value === "string" && value.trim() !== "";

const asArray = (value) => (Array.isArray(value) ? value : []);

/** Non-negative integer, or null when the value cannot be read as one. */
const asPositiveInt = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const floored = Math.floor(parsed);
  return floored > 0 ? floored : null;
};

const asCount = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
};

/**
 * How full the case is, and the one word for it.
 *
 * @param {number} usedCount how many items are in (or staged for) the case.
 * @param {number|string} spotLimit the container's `containerSpotLimit` column.
 * @returns {{used: number, limit: number|null, free: number|null,
 *   excess: number, hasLimit: boolean, isFull: boolean, isOver: boolean,
 *   fillPct: number, tone: "under"|"full"|"over"|"unknown",
 *   statusLabel: string, overMessage: string|null}}
 */
export const summarizeCapacity = (usedCount, spotLimit) => {
  const used = asCount(usedCount);
  const limit = asPositiveInt(spotLimit);

  // No limit recorded on the container — show what is inside and let the user
  // save. Reporting "full" here would block a legitimate save.
  if (limit === null) {
    return {
      used,
      limit: null,
      free: null,
      excess: 0,
      hasLimit: false,
      isFull: false,
      isOver: false,
      fillPct: 0,
      tone: "unknown",
      statusLabel: plural(used, "item"),
      overMessage: null,
    };
  }

  const free = limit - used;
  const isOver = used > limit;
  const isFull = used === limit;
  const excess = isOver ? used - limit : 0;

  let tone = "under";
  let statusLabel = `${plural(free, "spot")} left`;
  if (isFull) {
    tone = "full";
    statusLabel = "Case full";
  } else if (isOver) {
    tone = "over";
    statusLabel = `${excess} over capacity`;
  }

  return {
    used,
    limit,
    free,
    excess,
    hasLimit: true,
    isFull,
    isOver,
    fillPct: Math.min(100, Math.round((used / limit) * 100)),
    tone,
    statusLabel,
    overMessage: isOver
      ? `This case holds ${limit}. Remove ${plural(excess, "item")} before saving.`
      : null,
  };
};

/**
 * The contents, grouped by item group, so a bare serial number always sits
 * under something that says what it is.
 *
 * The container-items endpoint is not documented to return `item_group`, so a
 * response without one collapses to a single plain group rather than a column
 * of blank headings.
 *
 * @param {Array<object>} items rows from `GET /db_inventory/container-items/:id`.
 * @returns {Array<{name: string, count: number, countLabel: string,
 *   items: Array<{itemId: unknown, serial: string}>}>}
 */
export const groupContainerItems = (items) => {
  const order = [];
  const buckets = {};

  asArray(items).forEach((item) => {
    const serial = item?.serial_number ?? item?.serial;
    if (!isFilledString(serial) && typeof serial !== "number") return;

    const rawGroup = item?.item_group ?? item?.group;
    const name = isFilledString(rawGroup) ? rawGroup.trim() : "Items";

    if (!buckets[name]) {
      buckets[name] = [];
      order.push(name);
    }
    buckets[name].push({ itemId: item?.item_id, serial: String(serial) });
  });

  return order.map((name) => ({
    name,
    count: buckets[name].length,
    countLabel: String(buckets[name].length),
    items: buckets[name],
  }));
};

const uniqueKeys = (ids) => {
  const set = new Set();
  asArray(ids).forEach((id) => {
    if (id === null || id === undefined) return;
    set.add(String(id));
  });
  return set;
};

/**
 * What is staged but not yet saved, in the two phrasings the UI needs: a
 * sentence for the panel's pending bar, and a compact delta for the packing
 * modal. Set semantics — reordering is not a change, and a duplicate id counts
 * once.
 *
 * @param {Array<unknown>} baselineIds ids currently persisted in the container.
 * @param {Array<unknown>} stagedIds ids the user has staged.
 * @returns {{addedCount: number, removedCount: number, hasChanges: boolean,
 *   changeLabel: string|null, deltaLabel: string, saveLabel: string}}
 */
export const describeContentChanges = (baselineIds, stagedIds) => {
  const baseline = uniqueKeys(baselineIds);
  const staged = uniqueKeys(stagedIds);

  let addedCount = 0;
  staged.forEach((id) => {
    if (!baseline.has(id)) addedCount += 1;
  });
  let removedCount = 0;
  baseline.forEach((id) => {
    if (!staged.has(id)) removedCount += 1;
  });

  const hasChanges = addedCount > 0 || removedCount > 0;

  let changeLabel = null;
  if (addedCount > 0 && removedCount > 0) {
    changeLabel = `${plural(addedCount, "item")} added, ${plural(
      removedCount,
      "item",
    )} removed — not saved yet`;
  } else if (addedCount > 0) {
    changeLabel = `${plural(addedCount, "item")} added — not saved yet`;
  } else if (removedCount > 0) {
    changeLabel = `${plural(removedCount, "item")} removed — not saved yet`;
  }

  const deltaParts = [];
  if (addedCount > 0) deltaParts.push(`+${addedCount} added`);
  if (removedCount > 0) deltaParts.push(`−${removedCount} taken out`);
  const deltaLabel = deltaParts.length > 0
    ? `${deltaParts.join(" · ")} · was ${baseline.size}`
    : "No changes yet";

  // The button states the outcome rather than the verb: "Add 3 items", not
  // "Save".
  let saveLabel = "Save";
  if (addedCount > 0 && removedCount > 0) {
    saveLabel = `Save ${addedCount + removedCount} changes`;
  } else if (addedCount > 0) {
    saveLabel = `Add ${plural(addedCount, "item")}`;
  } else if (removedCount > 0) {
    saveLabel = `Remove ${plural(removedCount, "item")}`;
  }

  return { addedCount, removedCount, hasChanges, changeLabel, deltaLabel, saveLabel };
};

/**
 * The demoted destructive action. The old Popconfirm asked "Are you sure you
 * want to remove all items inside this container?" without ever saying how
 * many that was.
 *
 * @param {number} usedCount how many items the case currently holds.
 * @returns {{isAvailable: boolean, buttonLabel: string,
 *   confirmTitle: string, confirmCta: string}}
 */
export const describeEmptyAction = (usedCount) => {
  const used = asCount(usedCount);

  return {
    isAvailable: used > 0,
    buttonLabel: `Empty case (${used})`,
    confirmTitle:
      used === 1
        ? "Remove the only item from this case?"
        : `Remove all ${used} items from this case?`,
    confirmCta: `Remove ${plural(used, "item")}`,
  };
};

const FILTER_KEYS = ["category_name", "item_group", "brand", "ownership"];

/**
 * Assignable warehouse stock, narrowed by what was typed and picked.
 *
 * Search matches the serial number directly and runs against an
 * already-populated list — the old flow required choosing from four dropdowns
 * and pressing "Search items" before a single row appeared.
 *
 * @param {Array<object>} items rows from `POST /db_item/warehouse-items`.
 * @param {{query?: string, filters?: object, excludeIds?: Array<unknown>}} opts
 * @returns {Array<object>} the same row objects, filtered.
 */
export const filterWarehouseItems = (items, opts) => {
  const rows = asArray(items);
  const { query, filters, excludeIds } = opts ?? {};

  const needle = isFilledString(query) ? query.trim().toLowerCase() : "";
  const excluded = uniqueKeys(excludeIds);
  const active = FILTER_KEYS.filter((key) => isFilledString(filters?.[key]));

  return rows.filter((row) => {
    if (excluded.size > 0 && excluded.has(String(row?.item_id))) return false;

    if (needle !== "") {
      const serial = row?.serial_number;
      const haystack =
        isFilledString(serial) || typeof serial === "number" ? String(serial).toLowerCase() : "";
      if (!haystack.includes(needle)) return false;
    }

    return active.every((key) => row?.[key] === filters[key]);
  });
};

/**
 * Options for one refinement dropdown, in the order the values first appear.
 *
 * @param {Array<object>} items the rows to read values from.
 * @param {string} key the column to collect.
 * @param {string} anyLabel label for the leading "no filter" option.
 * @returns {Array<{value: string, label: string}>} always at least one entry.
 */
export const buildFilterOptions = (items, key, anyLabel) => {
  const seen = [];

  asArray(items).forEach((row) => {
    const value = row?.[key];
    if (!isFilledString(value)) return;
    const trimmed = value.trim();
    if (!seen.includes(trimmed)) seen.push(trimmed);
  });

  return [{ value: "", label: anyLabel }].concat(
    seen.map((value) => ({ value, label: value })),
  );
};
