/**
 * Reading one device's state and history at an event.
 *
 * Three screens navigate to /device-quick-glance and each dispatches a
 * differently shaped `deviceInfoSelected`:
 *
 *   table/DeviceDatabase   { company:[type,provider], activity, status,
 *                            serialNumber, entireData:{device,type,provider,…} }
 *   search/SearchDevice    same top level, but `entireData` is an unrelated
 *                          payload carrying neither `device` nor `type`
 *   ModalListOfDefectedDevices  its own template again
 *
 * The page read `deviceInfoSelected.entireData.type` and `.device` directly, so
 * arriving from the search bar rendered "undefined undefined" in the header, and
 * arriving with no selection at all — a reload of the URL, or after
 * `onResetDeviceInQuickGlance` — threw and took the page down. Everything reads
 * through `readDeviceSelection` now.
 */

const clean = (value) => {
  const text = String(value ?? "").trim();
  return text && text !== "undefined" && text !== "null" ? text : null;
};

const isLostValue = (value) => clean(value)?.toLowerCase() === "lost";

/** One normalized view of the selection, whichever screen built it. */
export function readDeviceSelection(selection) {
  const entire = selection?.entireData ?? {};
  const company = Array.isArray(selection?.company) ? selection.company : [];

  const serialNumber = clean(entire.device) ?? clean(selection?.serialNumber);
  const type = clean(entire.type) ?? clean(company[0]);
  const provider = clean(entire.provider) ?? clean(company[1]);
  const status = clean(selection?.status) ?? clean(entire.status);
  const activity = selection?.activity ?? entire.activity;

  // "LOST" is the sentinel DeviceDatabase writes into `activity`, and the status
  // field carries it too. Either one means lost, and lost outranks in-use.
  const isLost = isLostValue(activity) || isLostValue(status);

  return {
    hasData: Boolean(serialNumber),
    serialNumber,
    type,
    provider,
    status,
    isLost,
    isAssigned: !isLost && activity === true,
  };
}

/**
 * What state the device is in, as one chip.
 *
 * `tone` is the semantic tone from the profile design system: critical for lost,
 * warning for a recorded fault, action for out with someone, success for free.
 */
export function describeDeviceCondition({ isAssigned, isLost, status } = {}) {
  if (isLost) {
    return { key: "lost", tone: "critical", label: "Lost" };
  }
  if (isAssigned) {
    return { key: "in_use", tone: "action", label: "In use" };
  }

  const condition = clean(status);
  if (condition && condition.toLowerCase() !== "operational") {
    return { key: "issue", tone: "warning", label: condition };
  }

  return { key: "available", tone: "success", label: "Available" };
}

const eventNameOf = (value) =>
  Array.isArray(value) ? clean(value[0]) : clean(value);

/** Assignment history: receiver records, newest first. */
export function toAssignmentRows(receivers) {
  const list = Array.isArray(receivers) ? receivers : [];

  return list
    .map((receiver, index) => {
      const device = receiver?.device ?? {};
      const isOut = device.status === true;
      return {
        key: receiver?.id ?? `assignment-${index}`,
        serialNumber: clean(device.serialNumber),
        deviceType: clean(device.deviceType),
        user: clean(receiver?.user),
        paymentIntent: clean(receiver?.paymentIntent),
        eventName: eventNameOf(receiver?.eventSelected),
        assignedAt: receiver?.timeStamp ?? receiver?.timestamp ?? null,
        state: isOut
          ? { key: "out", tone: "action", label: "In use" }
          : { key: "returned", tone: "success", label: "Returned" },
      };
    })
    .reverse();
}

/**
 * Reported faults: these are POOL records, so `device` is the serial **string**,
 * not a device object.
 *
 * The old page concatenated these rows into the assignment table, whose status
 * column read `record.device.status`. On a string that is `undefined`, which the
 * column's ternary rendered as "Returned" — so a device written off as lost was
 * displayed as returned. They are their own tab now, with their own columns.
 */
export function toIssueRows(records) {
  const list = Array.isArray(records) ? records : [];

  return list.map((record, index) => ({
    key: record?.id ?? `issue-${index}`,
    serialNumber: clean(record?.device),
    deviceType: clean(record?.type),
    condition: clean(record?.status) ?? "Reported",
    comment: clean(record?.comment),
    user: clean(record?.user),
    admin: clean(record?.admin),
    eventName: eventNameOf(record?.eventSelected),
    reportedAt: record?.timeStamp ?? record?.timestamp ?? null,
  }));
}

/** Search across either row shape, on the fields a reader can see. */
export function filterDeviceRows(rows, term) {
  const list = Array.isArray(rows) ? rows : [];
  const needle = String(term ?? "").trim().toLowerCase();
  if (!needle) return list;

  return list.filter((row) =>
    [row?.user, row?.eventName, row?.serialNumber, row?.condition, row?.comment]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(needle)
  );
}

/**
 * The at-a-glance row. At most one tile is critical — the severity stripe only
 * works as an alarm while it is the single loudest thing on the page.
 */
export function buildDeviceStatTiles({ assignments, issues, condition }) {
  const history = Array.isArray(assignments) ? assignments : [];
  const faults = Array.isArray(issues) ? issues : [];
  const consumers = new Set(history.map((row) => row.user).filter(Boolean));
  const state = condition ?? describeDeviceCondition({});
  const isLost = state.key === "lost";

  return [
    {
      label: "Right now",
      value: state.label,
      sub: isLost ? "Written off" : null,
      // Lost is already the loudest thing on the page; the issues tile stands
      // down so there is only ever one stripe.
      tone: isLost ? "critical" : "neutral",
      testId: "device-stat-now",
    },
    {
      label: "Times assigned",
      value: history.length,
      sub: history.length === 0 ? "Never handed out" : "At this event",
      testId: "device-stat-assignments",
    },
    {
      label: "Consumers",
      value: consumers.size,
      sub: consumers.size === 1 ? "One holder" : "Distinct holders",
      testId: "device-stat-consumers",
    },
    {
      label: "Issues",
      value: faults.length,
      tone: faults.length > 0 && !isLost ? "critical" : "neutral",
      sub: faults.length === 0 ? "None reported" : "Reported faults",
      testId: "device-stat-issues",
    },
  ];
}
