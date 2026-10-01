/**
 * The two bars of the event's device card, from the event's `receiversPool`
 * (Mongo), not the company inventory in SQL.
 *
 *   location  — where the units are: out with a consumer, or back on site.
 *   condition — what state they are in: operational, needs repair, lost.
 *
 * A lost unit is written `{ status: "Lost", activity: false }`
 * (`consumer/lostFee/actions/Cash.jsx`), the same `activity` as one returned
 * fine. Reading location from `activity` alone would put it on site, so it is
 * left out of that bar and counted in `lostExcluded`.
 */
const normalizedStatus = (unit) => `${unit?.status ?? ""}`.trim().toLowerCase();

export const isLostDevice = (unit) => normalizedStatus(unit) === "lost";

/** Not operational: returned with an issue, or lost. Feeds the issues list. */
export const needsAttention = (unit) => normalizedStatus(unit) !== "operational";

export const summarizeEventDevices = (pool) => {
  const units = Array.isArray(pool) ? pool : [];

  const lost = units.filter(isLostDevice).length;
  const needsRepair = units.filter((unit) => needsAttention(unit) && !isLostDevice(unit)).length;

  const present = units.filter((unit) => !isLostDevice(unit));
  const checkedOut = present.filter((unit) => unit.activity === true).length;

  return {
    location: {
      checkedOut,
      onSite: present.length - checkedOut,
      lostExcluded: lost,
      total: present.length,
    },
    condition: {
      operational: units.length - lost - needsRepair,
      needsRepair,
      lost,
      total: units.length,
    },
  };
};
