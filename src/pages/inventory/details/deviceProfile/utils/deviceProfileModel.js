/**
 * Everything the device profile knows about a single unit, derived in one
 * place so the page components stay presentational.
 *
 * A device is a custody chain, not a row. The API hands us three partial views
 * of that chain — item_inv (what it is and where it sits now), the member lease
 * table (first-class assignments, with real due dates), and lease_info (the
 * older staff path) — and none of them alone answers "who has this and when is
 * it back". These helpers merge them.
 */

import {
  getLoanStatus,
  startOfLocalDay,
  toDate,
} from "../../../../../components/UX/profile/utils/loanStatus";
import { composeMemberAddress } from "../../../../conditionalPage/utils/memberTableUtils";

const DAY_MS = 24 * 60 * 60 * 1000;

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

/**
 * MySQL LEFT JOINs hand back real nulls, but several columns also carry the
 * *string* "null" from older writes. Both have to read as absent, otherwise the
 * page prints them — which is exactly how the old table produced
 * "null, null, null, null" in its Location column.
 */
const ABSENT = new Set(["", "null", "undefined", "n/a", "-"]);

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parse a date the way the reader means it.
 *
 * `new Date("2026-08-05")` is UTC midnight by spec, so west of Greenwich it
 * lands on Aug 4 local — and assigned_date / expected_return_date are DATE
 * columns that serialize exactly like that. Left alone, a device due today
 * renders as a day overdue. Date-only strings are therefore built as local
 * midnight; full timestamps still go through the shared parser unchanged.
 */
export function parseDateValue(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string") {
    const match = value.trim().match(DATE_ONLY_RE);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
  }
  return toDate(value);
}

export const clean = (value) => {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  return ABSENT.has(text.toLowerCase()) ? "" : text;
};

/** item_inv.sub_location is a JSON-stringified array — or a bare string, or junk. */
export function parseSubLocations(raw) {
  if (Array.isArray(raw)) return raw.map(clean).filter(Boolean);
  const text = clean(raw);
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(clean).filter(Boolean);
    return clean(parsed) ? [clean(parsed)] : [];
  } catch {
    return [text];
  }
}

/**
 * Where the device physically is, as something a person can read.
 *
 * In the warehouse it's the warehouse name plus its shelf/bin sub-locations;
 * out on assignment it's the event address. Returns null — never a string of
 * nulls — when nothing was recorded, so the caller can show a real empty state.
 */
export function resolveLocation(row = {}) {
  const warehouseName = clean(row.location);
  const inWarehouse = Number(row.warehouse) === 1;

  if (inWarehouse && warehouseName) {
    const subs = parseSubLocations(row.sub_location);
    return subs.length ? `${warehouseName} · ${subs.join(" · ")}` : warehouseName;
  }

  const address = [
    row.street_address,
    row.city_address,
    row.state_address,
    row.zip_address,
  ]
    .map(clean)
    .filter(Boolean)
    .join(", ");

  if (address) return address;
  // An assigned device with no address still has a home warehouse on the item
  // row; that beats showing nothing.
  return warehouseName || null;
}

/**
 * Assignments made through the staff path don't reference a person — they
 * fabricate an event whose name *is* the person:
 *   "Marcus Webb / marcus@school.org / 7/21/2026 / reference: 1690000000"
 * Pull the human back out of it. Returns null for anything unparseable so
 * callers can fall back to the raw event name.
 */
export function parseAssignmentEventName(eventName) {
  const raw = clean(eventName);
  if (!raw) return null;

  const parts = raw.split("/").map((part) => part.trim());
  const emailPart = parts.find((part) => EMAIL_RE.test(part));
  const email = emailPart ? emailPart.match(EMAIL_RE)[0] : null;

  if (!email) return { label: raw, email: null, isPerson: false };

  const first = parts[0];
  const label = first && !EMAIL_RE.test(first) ? first : email;
  return { label, email, isPerson: true };
}

/** A member lease is open until it's explicitly marked returned. */
export const isMemberLeaseOpen = (lease) =>
  Number(lease?.returned) !== 1 && !clean(lease?.returned_date);

/**
 * Normalize the two lease shapes onto one record.
 *
 * lease_info (staff) has no `returned` column — that path deletes the row on
 * return, so any row still present is an open loan.
 */
export function normalizeLease(lease, kind) {
  if (!lease) return null;
  if (kind === "member") {
    return {
      kind: "member",
      leaseId: lease.id ?? lease.lease_id ?? null,
      personId: lease.member_id ?? null,
      assignedDate: lease.assigned_date ?? null,
      expectedReturnDate: lease.expected_return_date ?? null,
      returnedDate: lease.returned_date ?? null,
      open: isMemberLeaseOpen(lease),
      location: clean(lease.location) || null,
      returnStatus: clean(lease.return_status) || null,
      conditionNote: clean(lease.condition_note) || null,
    };
  }
  return {
    kind: "staff",
    leaseId: lease.id ?? lease.lease_id ?? null,
    personId: lease.staff_member_id ?? null,
    assignedDate: lease.subscription_initial_date ?? null,
    expectedReturnDate: lease.subscription_expected_return_data ?? null,
    returnedDate: null,
    open: true,
    location: clean(lease.location) || null,
    returnStatus: null,
    conditionNote: null,
  };
}

const byNewest = (a, b) => {
  const left = parseDateValue(a.assignedDate)?.getTime() ?? 0;
  const right = parseDateValue(b.assignedDate)?.getTime() ?? 0;
  return right - left;
};

/**
 * The device's current situation: in stock or out, with whom, and how late.
 *
 * `warehouse === 1` is the item table's own answer and stays authoritative for
 * stock status — a lease row that was never closed shouldn't make an on-shelf
 * device claim it's out.
 */
export function deriveDeviceState({
  item = {},
  memberLeases = [],
  staffLeases = [],
  now = new Date(),
} = {}) {
  const normalized = [
    ...memberLeases.map((lease) => normalizeLease(lease, "member")),
    ...staffLeases.map((lease) => normalizeLease(lease, "staff")),
  ]
    .filter(Boolean)
    .sort(byNewest);

  const inStock = Number(item.warehouse) === 1;
  const openLease = inStock ? null : normalized.find((lease) => lease.open) ?? null;

  const lastClosed =
    normalized.find((lease) => !lease.open && lease.returnedDate) ?? null;

  const loan = openLease
    ? getLoanStatus(
        {
          // Normalized first: getLoanStatus is shared with the member profile
          // and must keep its own parsing, so the fix lands at this call site.
          expectedReturnDate: parseDateValue(openLease.expectedReturnDate),
          returnedDate: parseDateValue(openLease.returnedDate),
        },
        now
      )
    : null;

  return {
    inStock,
    statusLabel: inStock ? "In stock" : "In use",
    statusTone: inStock ? "success" : "warning",
    condition: clean(item.condition) || "Operational",
    ownership: clean(item.ownership) === "Rent" ? "Leased" : clean(item.ownership) || null,
    leases: normalized,
    openLease,
    lastClosed,
    loan,
    location: resolveLocation(item),
  };
}

/**
 * Days this unit spent assigned inside the trailing window.
 *
 * Counted as a set of calendar days rather than a sum of durations so that two
 * overlapping leases — which the data does contain — can't report 40 days out
 * of the last 30.
 */
export function summarizeUtilization({
  memberLeases = [],
  staffLeases = [],
  windowDays = 30,
  now = new Date(),
} = {}) {
  const today = startOfLocalDay(now);
  if (!today) return { daysOut: 0, windowDays, ratio: 0 };

  const windowStart = new Date(today.getTime() - (windowDays - 1) * DAY_MS);
  const out = new Set();

  const leases = [
    ...memberLeases.map((lease) => normalizeLease(lease, "member")),
    ...staffLeases.map((lease) => normalizeLease(lease, "staff")),
  ].filter(Boolean);

  for (const lease of leases) {
    const start = startOfLocalDay(parseDateValue(lease.assignedDate));
    if (!start) continue;
    const rawEnd = lease.open
      ? today
      : startOfLocalDay(parseDateValue(lease.returnedDate));
    const end = rawEnd && rawEnd <= today ? rawEnd : today;

    const from = start < windowStart ? windowStart : start;
    for (let day = from.getTime(); day <= end.getTime(); day += DAY_MS) {
      out.add(day);
    }
  }

  const daysOut = out.size;
  return {
    daysOut,
    windowDays,
    ratio: windowDays > 0 ? daysOut / windowDays : 0,
  };
}

/**
 * The custody chain, newest first.
 *
 * Leases are the source of truth because they carry real dates and a returned
 * flag. Tracking rows (item_inv_assigned_event joined to event_info) only get
 * used when there are no leases at all — legacy records predate the lease
 * tables, and showing nothing for them would read as "never assigned".
 */
export function buildCustodyTimeline({
  item = {},
  memberLeases = [],
  staffLeases = [],
  trackingRows = [],
  resolvePersonLabel,
} = {}) {
  const entries = [];
  const labelFor = (lease) =>
    resolvePersonLabel?.(lease) ??
    (lease.kind === "member" ? "a member" : "a staff member");

  const leases = [
    ...memberLeases.map((lease) => normalizeLease(lease, "member")),
    ...staffLeases.map((lease) => normalizeLease(lease, "staff")),
  ].filter(Boolean);

  leases.forEach((lease, index) => {
    const who = labelFor(lease);

    if (lease.returnedDate) {
      entries.push({
        id: `return-${lease.kind}-${lease.leaseId ?? index}`,
        kind: "returned",
        tone: "success",
        date: lease.returnedDate,
        personLabel: who,
        personId: lease.personId,
        personKind: lease.kind,
        detail: lease.conditionNote || lease.returnStatus || null,
      });
    }

    if (lease.assignedDate) {
      entries.push({
        id: `assign-${lease.kind}-${lease.leaseId ?? index}`,
        kind: "assigned",
        tone: "action",
        date: lease.assignedDate,
        personLabel: who,
        personId: lease.personId,
        personKind: lease.kind,
        dueDate: lease.expectedReturnDate,
        location: lease.location,
      });
    }
  });

  if (entries.length === 0) {
    trackingRows.forEach((row, index) => {
      const parsed = parseAssignmentEventName(row.event_name);
      if (!parsed) return;
      entries.push({
        id: `tracking-${row.event_id ?? index}`,
        kind: "assigned",
        tone: "neutral",
        date: row.created_at ?? row.date_begin ?? null,
        personLabel: parsed.label,
        personEmail: parsed.email,
        personKind: "legacy",
        location: resolveLocation(row),
        legacy: true,
      });
    });
  }

  if (item.create_at || item.created_at) {
    entries.push({
      id: `created-${item.item_id ?? "item"}`,
      kind: "created",
      tone: "neutral",
      date: item.create_at ?? item.created_at,
      cost: item.cost ?? null,
      ownership: clean(item.ownership) || null,
    });
  }

  return entries.sort((a, b) => {
    const left = parseDateValue(a.date)?.getTime();
    const right = parseDateValue(b.date)?.getTime();
    // Undated entries sink rather than jumping to the top of the chain.
    if (left === undefined || left === null || Number.isNaN(left)) return 1;
    if (right === undefined || right === null || Number.isNaN(right)) return -1;
    return right - left;
  });
}


/* --------------------------------------------- Assigning from the device --- */

/**
 * Where a person would take the device.
 *
 * A member carries an address — as one `address` string or as four separate
 * `address_*` columns, which is why this goes through the member helper rather
 * than reading `raw.address` and getting `undefined` for most of the roster.
 * A company employee carries no address at all, so there is nothing to offer.
 */
export function resolvePersonLocation(person) {
  if (person?.kind !== "member") return "";
  return clean(composeMemberAddress(person?.raw ?? {})) ?? "";
}

/**
 * The location to show after somebody is picked.
 *
 * Two things it will not do: blank a field because the person has no address on
 * file, and overwrite something the operator typed. `touched` is the operator's
 * own edit — once they have set it, picking a different person leaves it alone.
 */
export function nextAssignLocation({ person, current, touched = false }) {
  if (touched) return current ?? "";
  const suggestion = resolvePersonLocation(person);
  return suggestion || (current ?? "");
}
