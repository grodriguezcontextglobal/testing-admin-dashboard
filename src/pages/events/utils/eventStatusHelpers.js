// Pure helpers for classifying an event by time/status and producing a
// short countdown label. Kept free of JSX so they can be used for both
// grouping logic and badge rendering.

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
  const status = getEventStatus(event);
  if (status === "live") return { text: "Live now", tone: "live" };
  if (status === "past") return { text: "Ended", tone: "past" };

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

/**
 * Map the event's logistics status to a labeled stage on a 3-segment stepper.
 * This tracks the post-event RETURN of devices to the warehouse:
 *   "no_received_yet" — default; devices still out at the event
 *   "in-transit"      — heading back to the warehouse (set when the event ends)
 *   "completed"       — checked back into inventory
 * `step` (1-3) is how many segments are filled; `barColor` fills them and
 * `labelColor` tints the status label.
 */
export const LOGISTICS_TOTAL_STEPS = 3;

export const getLogisticsStatus = (event) => {
  switch (event?.logistic_inventory_status) {
    case "no_received_yet":
      return {
        label: "Awaiting delivery",
        tone: "pending",
        progress: 8,
        barColor: "var(--warning-500, #F79009)",
      };
    case "completed":
      return {
        label: "Returned",
        tone: "ready",
        step: 3,
        barColor: "var(--success-500, #12B76A)",
        labelColor: "var(--success-700, #027A48)",
      };
    case "in-transit":
      return {
        label: "Returning to warehouse",
        tone: "info",
        step: 2,
        barColor: "var(--blue-500, #2E90FA)",
        labelColor: "var(--blue-700, #175CD3)",
      };
    case "in-idle":
      return {
        label: "At event",
        tone: "pending",
        step: 1,
        barColor: "var(--primary-600, #7F56D9)",
        labelColor: "var(--primary-700, #6941C6)",
      };
    default:
      return null;
  }
};

/**
 * Ordered legend for the equipment-location stepper — shown in the card's
 * info tooltip. Colors match the stepper segments.
 */
export const LOGISTICS_LEGEND = [
  {
    label: "At event",
    description: "Devices are out at the event",
    color: "var(--primary-600, #7F56D9)",
  },
  {
    label: "In transit",
    description: "On the way back to the assigned location",
    color: "var(--blue-500, #2E90FA)",
  },
  {
    label: "Returned",
    description: "Checked back into inventory",
    color: "var(--success-500, #12B76A)",
  },
];

/** Background/foreground colors for a countdown badge by tone. */
export const countdownBadgeColors = (tone) => {
  switch (tone) {
    case "live":
      return { bg: "var(--success-50, #ECFDF3)", fg: "var(--success-700, #027A48)" };
    case "soon":
      return { bg: "var(--warning-50, #FFFAEB)", fg: "var(--warning-700, #B54708)" };
    case "past":
      return { bg: "var(--gray-100, #F2F4F7)", fg: "var(--gray-600, #475467)" };
    case "upcoming":
    default:
      return { bg: "var(--blue-50, #EFF8FF)", fg: "var(--blue-700, #175CD3)" };
  }
};
