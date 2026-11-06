// Pure helpers for classifying an event by time/status and producing a
// short countdown label. Kept free of JSX so they can be used for both
// grouping logic and badge rendering.

import { isDraftEvent } from "./eventDraft";
import { draftStatusLabel } from "./eventLifecycle";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Classify an event as "live", "upcoming", or "past".
 * - past: inactive, or its end date is in the past
 * - live: active and the current moment is within [begin, end]
 * - upcoming: active and not yet started
 */
export const getEventStatus = (event) => {
  const now = new Date();
  const begin = new Date(event?.eventInfoDetail?.dateBegin);
  const end = new Date(event?.eventInfoDetail?.dateEnd);

  if (event?.active === false || end < now) return "past";
  if (now >= begin && now <= end) return "live";
  return "upcoming";
};

/**
 * Short, human countdown label plus a tone hint for badge styling.
 * tone: "live" | "soon" (<= 7 days out) | "upcoming" | "past"
 */
export const getCountdownLabel = (event) => {
  if (isDraftEvent(event)) return { text: draftStatusLabel(event), tone: "draft" };
  const status = getEventStatus(event);
  if (status === "live") return { text: "Live now", tone: "live" };
  if (status === "past") return { text: "Closed", tone: "past" };

  const now = new Date();
  const begin = new Date(event?.eventInfoDetail?.dateBegin);
  const days = Math.ceil((begin.getTime() - now.getTime()) / MS_PER_DAY);

  let text;
  if (days <= 0) text = "Today";
  else if (days === 1) text = "Tomorrow";
  else if (days < 7) text = `in ${days} days`;
  else if (days < 14) text = "in 1 week";
  else if (days < 30) text = `in ${Math.round(days / 7)} weeks`;
  else if (days < 60) text = "in 1 month";
  else text = `in ${Math.round(days / 30)} months`;

  return { text, tone: days <= 7 ? "soon" : "upcoming" };
};

/**
 * At-a-glance readiness metrics derived purely from the event-list payload
 * (no extra API calls): total planned devices, distinct device groups, and
 * staff assigned.
 */
export const getEventMetrics = (event) => {
  const deviceSetup = Array.isArray(event?.deviceSetup) ? event.deviceSetup : [];
  const totalDevices = deviceSetup.reduce(
    (sum, group) => sum + (Number(group?.quantity) || 0),
    0,
  );
  const deviceGroups = deviceSetup.length;
  const staff =
    (event?.staff?.adminUser?.length || 0) +
    (event?.staff?.headsetAttendees?.length || 0);

  return { totalDevices, deviceGroups, staff };
};

const EQUIPMENT_TONES = {
  warning: { dot: "var(--warning-500, #F79009)", text: "var(--warning-700, #B54708)" },
  primary: { dot: "var(--primary-600, #7F56D9)", text: "var(--primary-700, #6941C6)" },
  info: { dot: "var(--blue-500, #2E90FA)", text: "var(--blue-700, #175CD3)" },
  success: { dot: "var(--success-500, #12B76A)", text: "var(--success-700, #027A48)" },
};

// One name per stage of the event's `logistic_inventory_status`. `received`
// and `in-idle` are both written for an event that holds its devices, so they
// read the same.
const EQUIPMENT_STAGES = {
  no_received_yet: {
    label: "Awaiting delivery",
    hint: "Devices haven't reached the event yet",
    tone: "warning",
  },
  received: {
    label: "At event",
    hint: "Devices are with the event team",
    tone: "primary",
  },
  "in-idle": {
    label: "At event",
    hint: "Devices are with the event team",
    tone: "primary",
  },
  "in-transit": {
    label: "Returning",
    hint: "On the way back to the warehouse",
    tone: "info",
  },
  completed: {
    label: "Returned",
    hint: "Checked back into inventory",
    tone: "success",
  },
};

/**
 * Where the event's equipment is, as one labeled status for the event card:
 * `{ label, hint, tone, dot, text }`, where `dot` and `text` are the colors
 * for the status dot and its label. `null` when the event has no status (or
 * one this client doesn't know), so the card shows nothing instead of a guess.
 */
export const getEquipmentStatus = (event) => {
  const stage = EQUIPMENT_STAGES[event?.logistic_inventory_status];
  if (!stage) return null;
  return { ...stage, ...EQUIPMENT_TONES[stage.tone] };
};

/** Background/foreground colors for a countdown badge by tone. */
export const countdownBadgeColors = (tone) => {
  switch (tone) {
    case "live":
      return { bg: "var(--success-50, #ECFDF3)", fg: "var(--success-700, #027A48)" };
    case "soon":
      return { bg: "var(--warning-50, #FFFAEB)", fg: "var(--warning-700, #B54708)" };
    case "past":
    case "draft":
      return { bg: "var(--gray-100, #F2F4F7)", fg: "var(--gray-600, #475467)" };
    case "upcoming":
    default:
      return { bg: "var(--blue-50, #EFF8FF)", fg: "var(--blue-700, #175CD3)" };
  }
};
