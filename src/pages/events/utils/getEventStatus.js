/**
 * Derives an event's display status from `active` + eventInfoDetail dates.
 * Returns { key, label, color } where color maps to the shared Chip palette.
 *   live      → green   ("Live · ends in 2 days")
 *   upcoming  → blue    ("Upcoming · starts in 30 days")
 *   pastEnd   → amber   (active but end date passed — matches the reminder banner)
 *   ended     → gray
 *   draft     → gray   (setup never finished — see eventDraft.js)
 */
import { isDraftEvent } from "./eventDraft";

const DAY_MS = 24 * 60 * 60 * 1000;

const relativeDays = (fromMs, toMs) => {
  const diff = toMs - fromMs;
  if (diff <= 0) return null;
  if (diff < DAY_MS) {
    const hours = Math.max(1, Math.round(diff / (60 * 60 * 1000)));
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  const days = Math.round(diff / DAY_MS);
  return `${days} day${days > 1 ? "s" : ""}`;
};

export const getEventStatus = (event) => {
  const now = Date.now();
  const begin = new Date(event?.eventInfoDetail?.dateBegin).getTime();
  const end = new Date(event?.eventInfoDetail?.dateEnd).getTime();

  // Before `active`: a draft is inactive too, and it has not ended — it never
  // started (meeting 2026-09-29 `39:16`).
  if (isDraftEvent(event)) return { key: "draft", label: "Draft", color: "default" };
  if (!event?.active) return { key: "ended", label: "Ended", color: "default" };
  if (Number.isFinite(begin) && now < begin) {
    const rel = relativeDays(now, begin);
    return {
      key: "upcoming",
      label: rel ? `Upcoming · starts in ${rel}` : "Upcoming",
      color: "info",
    };
  }
  if (Number.isFinite(end) && now > end) {
    return { key: "pastEnd", label: "Past end date", color: "warning" };
  }
  const rel = Number.isFinite(end) ? relativeDays(now, end) : null;
  return {
    key: "live",
    label: rel ? `Live · ends in ${rel}` : "Live",
    color: "success",
  };
};

export default getEventStatus;
