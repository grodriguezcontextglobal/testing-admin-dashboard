/**
 * What a consumer is holding at an event, derived from their receiver records.
 *
 * This used to live inside ConsumerActivity.jsx as three nested closures over a
 * `new Set()` of objects — which never deduplicated anything, since every
 * receiver is a distinct object reference. The counts were right by accident.
 * They are counted deliberately here, and a lost device is finally its own
 * bucket instead of falling out of both "out" and "returned".
 */

const LOST = "lost";

/** true = still out, false/absent = returned, "Lost" = written off. */
export function describeDeviceState(status) {
  if (typeof status === "string") {
    if (status.trim().toLowerCase() === LOST) {
      return { key: "lost", tone: "critical", label: "Lost" };
    }
    return { key: "other", tone: "neutral", label: status };
  }
  if (status === true) return { key: "out", tone: "neutral", label: "In use" };
  return { key: "returned", tone: "success", label: "Returned" };
}

export function summarizeConsumerDevices(receivers) {
  const list = Array.isArray(receivers) ? receivers : [];

  return list.reduce(
    (acc, receiver) => {
      const device = receiver?.device ?? {};
      const state = describeDeviceState(device.status);
      acc.total += 1;
      if (state.key === "out") {
        acc.out += 1;
        acc.valueOnLoan += Number(device.deviceValue) || 0;
      }
      if (state.key === "returned") acc.returned += 1;
      if (state.key === "lost") acc.lost += 1;
      return acc;
    },
    { total: 0, out: 0, returned: 0, lost: 0, valueOnLoan: 0 }
  );
}

/** How many devices the consumer's transactions asked for, across the event. */
export function countRequestedDevices(transactions) {
  const list = Array.isArray(transactions) ? transactions : [];
  return list.reduce((total, transaction) => {
    const requested = Number(transaction?.device?.[0]?.deviceNeeded) || 0;
    return total + requested;
  }, 0);
}

const currency = (value) =>
  `$${(Number(value) || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;

/**
 * The at-a-glance row. Requested → out → returned → lost reads as the actual
 * lifecycle of a device, so the tiles double as a progress indicator.
 *
 * At most one tile is critical: the severity stripe only works as an alarm
 * while it is the single loudest thing on the page.
 */
export function buildConsumerStatTiles({ requested = 0, summary }) {
  const { out, returned, lost, total } = summary ?? {
    out: 0,
    returned: 0,
    lost: 0,
    total: 0,
  };
  const pending = Math.max(requested - total, 0);

  return [
    {
      label: "Requested",
      value: requested,
      sub: pending > 0 ? `${pending} still to assign` : "All assigned",
      testId: "stat-requested",
    },
    {
      label: "Devices out",
      value: out,
      sub:
        out > 0
          ? `${currency(summary?.valueOnLoan)} on loan`
          : "Nothing pending",
      testId: "stat-devices-out",
    },
    {
      label: "Returned",
      value: returned,
      sub: returned > 0 ? "Checked back in" : "None yet",
      testId: "stat-returned",
    },
    {
      label: "Lost",
      value: lost,
      tone: lost > 0 ? "critical" : "neutral",
      sub: lost > 0 ? "Fee chargeable" : "None reported",
      testId: "stat-lost",
    },
  ];
}

/**
 * Chips for the identity card. Descriptors rather than JSX so the wording is
 * testable without rendering; the page turns them into <StatusChip>.
 *
 * Every chip states a count. The old header said "Active devices" / "No active
 * devices", which never told anyone how many.
 */
export function buildConsumerChips(summary) {
  const { out = 0, lost = 0 } = summary ?? {};

  return [
    lost > 0 && {
      key: "lost",
      tone: "critical",
      pip: true,
      label: `${lost} lost`,
    },
    {
      key: "out",
      tone: out > 0 ? "success" : "neutral",
      pip: out > 0,
      label:
        out > 0 ? `${out} device${out === 1 ? "" : "s"} out` : "No devices out",
    },
  ].filter(Boolean);
}
