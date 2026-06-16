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
 * Map the event's logistics status to a labeled progress stage.
 * Known values: "no_received_yet" | "in-idle" | "in-transit" | "completed".
 * `progress` drives a 4-stage readiness bar; `barColor` is its fill.
 */
export const getLogisticsStatus = (event) => {
  switch (event?.logistic_inventory_status) {
    case "no_received_yet":
      return {
        label: "Awaiting delivery",
        tone: "pending",
        progress: 8,
        barColor: "var(--warning-500, #F79009)",
      };
    case "in-idle":
      return {
        label: "On site",
        tone: "ready",
        progress: 50,
        barColor: "var(--success-500, #12B76A)",
      };
    case "in-transit":
      return {
        label: "Returning to warehouse",
        tone: "info",
        progress: 75,
        barColor: "var(--blue-500, #2E90FA)",
      };
    case "completed":
      return {
        label: "Returned to warehouse",
        tone: "done",
        progress: 100,
        barColor: "var(--gray-400, #98A2B3)",
      };
    default:
      return null;
  }
};

/**
 * Badge props for the inventory status pill shown on event cards.
 * Returns { color, label } for <BadgeWithDot>, or null when status is unknown.
 */
export const getInventoryBadgeProps = (event) => {
  switch (event?.logistic_inventory_status) {
    case "no_received_yet":
      return { color: "warning", label: "Awaiting delivery" };
    case "in-idle":
      return { color: "success", label: "On site" };
    case "in-transit":
      return { color: "blue", label: "In transit" };
    case "completed":
      return { color: "gray", label: "Returned" };
    default:
      return null;
  }
};

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
