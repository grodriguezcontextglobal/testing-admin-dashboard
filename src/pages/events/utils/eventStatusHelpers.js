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
 * Map the event's logistics status to a labeled chip + tone.
 * Known values: "no_received_yet" | "in-transit" | "completed".
 */
export const getLogisticsStatus = (event) => {
  switch (event?.logistic_inventory_status) {
    case "completed":
      return { label: "Devices received", tone: "ready" };
    case "in-transit":
      return { label: "In transit", tone: "info" };
    case "no_received_yet":
      return { label: "Awaiting delivery", tone: "pending" };
    default:
      return null;
  }
};

/** Background/foreground colors for a small status chip by tone. */
export const logisticsChipColors = (tone) => {
  switch (tone) {
    case "ready":
      return { bg: "var(--success-50, #ECFDF3)", fg: "var(--success-700, #027A48)" };
    case "info":
      return { bg: "var(--blue-50, #EFF8FF)", fg: "var(--blue-700, #175CD3)" };
    case "pending":
    default:
      return { bg: "var(--warning-50, #FFFAEB)", fg: "var(--warning-700, #B54708)" };
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
