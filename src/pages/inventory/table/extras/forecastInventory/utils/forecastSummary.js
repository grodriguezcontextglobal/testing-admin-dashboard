/**
 * The numbers behind the inventory forecast screen.
 *
 * The screen used to encode its data in chip labels — `Total Events: 4`,
 * `Before: 12`, `Item Types: 9` — computed inline in the markup, so nothing was
 * testable and nothing could be compared side by side. The derivations live
 * here instead, and none of them touches the API: every value below comes from
 * the same `advanceSearch` payload the page already receives.
 */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const text = (value) => String(value ?? "").trim();

/** `2026-06-01` and `2026-6-1` both mean the same day. */
const parseDay = (value) => {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text(value));
  if (!match) return null;
  const [, year, month, day] = match;
  return { year: Number(year), month: Number(month), day: Number(day) };
};

/**
 * A day as a person reads it.
 *
 * Built from the string rather than from `new Date(value).toLocaleDateString()`,
 * which parses a bare `YYYY-MM-DD` as UTC midnight and then renders it in local
 * time — showing the previous day for every user west of UTC.
 */
export function formatDay(value) {
  const parts = parseDay(value);
  if (!parts) return text(value);
  return `${MONTHS[parts.month - 1] ?? parts.month} ${parts.day}, ${parts.year}`;
}

const daysInclusive = (start, end) => {
  const from = parseDay(start);
  const to = parseDay(end);
  if (!from || !to) return null;

  const ms =
    Date.UTC(to.year, to.month - 1, to.day) -
    Date.UTC(from.year, from.month - 1, from.day);
  return Math.floor(ms / 86400000) + 1;
};

/** "Jun 1, 2026 – Jun 30, 2026 · 30 days" — the context for everything below. */
export function formatPeriodLabel(period) {
  if (!period) return "";

  const start = period.start ?? period.date_start;
  const end = period.end ?? period.date_end;
  if (!text(start) && !text(end)) return "";

  const range = `${formatDay(start)} – ${formatDay(end)}`;
  const length = daysInclusive(start, end);
  if (!length || length < 1) return range;

  return `${range} · ${length} day${length === 1 ? "" : "s"}`;
}

/**
 * The shape of the window, not just its totals: a forecast is read to find the
 * day it falls short, and that day was nowhere on the old screen.
 */
export function summarizeDailyAnalysis(dailyAnalysis) {
  const rows = Array.isArray(dailyAnalysis) ? dailyAnalysis : [];

  let peakDemand = 0;
  let lowestAvailable = null;
  let shortDays = 0;
  let firstShortDate = null;

  rows.forEach((row) => {
    const demand = num(row?.total_demand);
    const available = num(row?.total_available);

    if (demand > peakDemand) peakDemand = demand;
    if (lowestAvailable === null || available < lowestAvailable) {
      lowestAvailable = available;
    }
    if (demand > available) {
      shortDays += 1;
      if (!firstShortDate) firstShortDate = text(row?.date);
    }
  });

  return {
    days: rows.length,
    peakDemand,
    lowestAvailable: lowestAvailable ?? 0,
    shortDays,
    firstShortDate,
  };
}

/**
 * Units held beyond what the company owns — what the old table called
 * "Current Rental" and computed inside a `render` callback.
 */
export function onRentalCount(item) {
  return Math.max(num(item?.total_available) - num(item?.owned_count), 0);
}

/**
 * Every location's items in one list.
 *
 * The projection used to be drawn as a two-column grid of cards, one per
 * location, each holding its own small table — so comparing one item across
 * locations meant reading two tables side by side and holding the numbers in
 * your head. One list with a Location column can be sorted and filtered.
 */
export function locationRows(locationData) {
  const locations = Array.isArray(locationData) ? locationData : [];
  const rows = [];

  locations.forEach((location, locationIndex) => {
    const items = Array.isArray(location?.items) ? location.items : [];

    items.forEach((item, itemIndex) => {
      const inStock = num(item?.total_available);

      rows.push({
        key: `${locationIndex}-${itemIndex}`,
        location: text(location?.location) || "Unknown location",
        category: text(item?.category ?? item?.category_name),
        group: text(item?.group ?? item?.item_group),
        owned: num(item?.owned_count),
        onRental: onRentalCount(item),
        inStock,
        netAvailable:
          item?.net_availability === undefined || item?.net_availability === null
            ? inStock
            : num(item.net_availability),
        status: text(item?.availability_status),
        restockNeeded: Boolean(item?.restock_needed),
      });
    });
  });

  return rows;
}

/**
 * How to colour an availability status. Unrecognised wording stays neutral
 * rather than being guessed at — a wrong green is worse than a grey.
 */
export function availabilityTone(status) {
  const value = text(status).toLowerCase();
  if (!value) return "neutral";
  if (/short|insufficient|unavailable|critical|none|out of/.test(value)) {
    return "danger";
  }
  if (/partial|tight|low|limited|warning|risk/.test(value)) return "warning";
  if (/available|sufficient|ok|full|good|covered/.test(value)) return "success";
  return "neutral";
}

/**
 * The three return buckets, ordered the way availability degrades.
 *
 * A unit back *before* the window is free for all of it; one back *during* it
 * is free for part of it; one back *after* it is not free at all. The old
 * screen chipped these as grey/amber/green — green on the worst case — and drew
 * each bucket as its own paginated table in a third of the page width.
 */
export const RETURN_WINDOWS = [
  {
    key: "before",
    source: "before_period",
    label: "Back before",
    tone: "success",
    hint: "Returned before the period starts — available for the whole window.",
  },
  {
    key: "within",
    source: "within_period",
    label: "Back during",
    tone: "warning",
    hint: "Returned inside the period — available for part of the window.",
  },
  {
    key: "after",
    source: "after_period",
    label: "Back after",
    tone: "danger",
    hint: "Still out when the period ends — unavailable for the whole window.",
  },
];

/** The three buckets flattened into one table. */
export function rentalReturnRows(rentalAnalysis) {
  const rows = [];

  RETURN_WINDOWS.forEach((window) => {
    const bucket = rentalAnalysis?.[window.source];
    if (!Array.isArray(bucket)) return;

    bucket.forEach((item, index) => {
      rows.push({
        ...item,
        // The same serial can appear in two buckets across a re-rental, so the
        // bucket is part of the key.
        key: `${window.key}-${index}-${text(item?.serial_number)}`,
        window: window.key,
      });
    });
  });

  return rows;
}

/** Counts for the bucket filter, taken from the rows the table will show. */
export function rentalReturnCounts(rentalAnalysis) {
  const counts = { before: 0, within: 0, after: 0, total: 0 };

  RETURN_WINDOWS.forEach((window) => {
    const bucket = rentalAnalysis?.[window.source];
    counts[window.key] = Array.isArray(bucket) ? bucket.length : 0;
    counts.total += counts[window.key];
  });

  const analyzed = rentalAnalysis?.summary?.total_analyzed;
  counts.analyzed = analyzed === undefined || analyzed === null ? counts.total : num(analyzed);

  return counts;
}

/**
 * The six numbers the screen opens with. One lonely "Item Types" card used to
 * sit in a quarter-width column with the rest of the summary commented out.
 */
export function buildForecastKpis({
  uniqueItemGroupsCount,
  locationData,
  overallSummary,
  dailyAnalysis,
  eventInventory,
} = {}) {
  const daily = summarizeDailyAnalysis(dailyAnalysis);
  const locationCount =
    overallSummary?.total_locations ??
    (Array.isArray(locationData) ? locationData.length : 0);

  return [
    {
      key: "itemTypes",
      label: "Item types",
      value: num(uniqueItemGroupsCount),
      hint: "Distinct items matching the search.",
      tone: "neutral",
    },
    {
      key: "locations",
      label: "Locations",
      value: num(locationCount),
      hint: "Locations holding those items.",
      tone: "neutral",
    },
    {
      key: "events",
      label: "Events in period",
      value: num(eventInventory?.total_events),
      hint: "Events committing inventory inside the window.",
      tone: "neutral",
    },
    {
      key: "peakDemand",
      label: "Peak demand",
      value: daily.peakDemand,
      hint: "Most units committed on any single day.",
      tone: "neutral",
    },
    {
      key: "lowestAvailable",
      label: "Lowest availability",
      value: daily.lowestAvailable,
      hint: "Fewest units free on any single day.",
      tone: "neutral",
    },
    {
      key: "shortDays",
      label: "Days short",
      value: daily.shortDays,
      hint: "Days where demand is above availability.",
      tone: daily.shortDays > 0 ? "danger" : "neutral",
    },
  ];
}

const PARAMETER_LABELS = [
  ["category", "Category"],
  ["group", "Item"],
  ["brand", "Brand"],
  ["location", "Location"],
];

/**
 * What the search was actually for. The parameters were passed straight to the
 * edit modal and never shown, so the results carried no record of the filters
 * that produced them.
 */
export function searchParameterChips(searchParameters) {
  if (!searchParameters) return [];

  return PARAMETER_LABELS.reduce((chips, [key, label]) => {
    const raw = searchParameters[key];
    const value = Array.isArray(raw)
      ? raw.filter(Boolean).join(", ")
      : text(raw);

    if (value) chips.push({ key, label, value });
    return chips;
  }, []);
}
