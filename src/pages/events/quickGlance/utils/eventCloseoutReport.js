/**
 * The report an event closes on.
 *
 * Closing an event without knowing what physically came back is the step that
 * costs the most time and goes wrong the most quietly: the inventory is
 * counted and consolidated by hand, and whatever is not accounted for is a
 * device somebody still has and nobody charged for. This turns the count into
 * the document that closing is authorised against.
 *
 * It joins the two records that each hold half the answer:
 *
 *   - the **warehouse** side, from `POST /db_event/event-count/reconcile`,
 *     which knows which of the event's items answered the sweep and which did
 *     not. It does not know who holds anything — the identifier work is scoped
 *     to `item_inv` and says so.
 *   - the **consumer** side, from `POST /receiver/receiver-assigned-list`,
 *     which knows which devices are still out and under whose payment intent.
 *     It does not know whether anything came back to the shelf.
 *
 * Neither half can produce this report alone, and where they disagree that
 * disagreement is itself the finding — it is not resolved silently here.
 *
 * Pure on purpose: it fetches nothing. The screen decides how much to look up,
 * and a report with no consumer names is still a usable report.
 */

/** Why a device appears in both records, or in neither, when it should not. */
export const DISPUTE = {
  /** Did not come back, and no consumer record holds it. Nobody to charge. */
  NO_HOLDER: "no-holder",
  /** Came back, and a consumer record still has it. Charging would be wrong. */
  RETURNED_BUT_ASSIGNED: "returned-but-assigned",
};

/**
 * A browser-side count, shaped like the server's answer.
 *
 * The event's expected inventory is its receivers pool, which the event page
 * has already fetched for its device table — so counting with the barcode gun
 * needs no new request and no deployed endpoint. Shaping the result like
 * `readCountResponse` means one report and one screen serve both paths: the
 * gun today, the RFID reader once `event-count/*` is live.
 *
 * `tagKnown: false` is the honest part. A barcode sweep learns nothing about
 * which devices carry a tag, so the missing ones cannot be split into "tagged
 * and silent" (an alarm) and "never tagged" (a manual check). They go in one
 * list and the report leaves `tagged` unknown rather than picking a story.
 *
 * @param {Array} poolInventory - receivers pool rows: `{ device, type, id }`
 * @param {string[]} scanned - serials read off the pallet
 */
export const localCountView = (poolInventory, scanned) => {
  const pool = Array.isArray(poolInventory) ? poolInventory : [];
  const reads = new Set(
    (Array.isArray(scanned) ? scanned : [])
      .map((value) => String(value ?? "").trim().toLowerCase())
      .filter(Boolean)
  );

  const seen = new Set();
  const matched = [];
  const missing = [];

  pool.forEach((row) => {
    const serial = String(row?.device ?? "").trim();
    if (!serial || seen.has(serial.toLowerCase())) return;
    seen.add(serial.toLowerCase());

    const entry = {
      item_id: row?.id ?? null,
      serial_number: serial,
      item_group: String(row?.type ?? "").trim(),
      epc: null,
    };
    if (reads.has(serial.toLowerCase())) {
      matched.push({ ...entry, matchedBy: serial, matchedVia: "serial" });
    } else {
      missing.push(entry);
    }
  });

  const unknown = [...reads]
    .filter((value) => !seen.has(value))
    .map((value) => value.toUpperCase());

  return {
    ok: true,
    tagKnown: false,
    summary: {
      expected: seen.size,
      scanned: reads.size,
      matched: matched.length,
      missing: missing.length,
      foreign: 0,
      unknown: unknown.length,
      ambiguous: 0,
    },
    matched,
    missingTagged: [],
    missingUntagged: missing,
    foreign: [],
    unknown,
    ambiguous: [],
    ambiguousByItem: {},
    balanced: true,
    complete: seen.size > 0 && missing.length === 0,
  };
};

const text = (value) => String(value ?? "").trim();
const key = (value) => text(value).toLowerCase();
const asArray = (value) => (Array.isArray(value) ? value : []);
const money = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const holderName = (consumer) => {
  const name = [consumer?.name, consumer?.lastName].filter(Boolean).join(" ").trim();
  return name || null;
};

/**
 * @param {object} args
 * @param {object} [args.count] - the view from `readCountResponse`
 * @param {Array} [args.receivers] - `listOfReceivers`, the devices still out
 * @param {object} [args.consumersByIntent] - paymentIntent → { name, lastName, email }
 * @returns {{returning: object[], outstanding: object[], disputed: object[],
 *   totals: object, counted: boolean}}
 */
export const buildCloseoutReport = ({
  count,
  receivers,
  consumersByIntent,
} = {}) => {
  const view = count && typeof count === "object" ? count : {};
  const counted = view.ok === true;

  /* No list at all is not the same as a list this serial is not in. The first
     means we do not know who holds anything; the second means nobody does.
     Treating them alike reports a whole event as unaccounted for whenever that
     lookup fails, and marks devices unchargeable that somebody is holding. */
  const holdersKnown = Array.isArray(receivers);

  /* Serial is the only thing both records share: the warehouse side speaks in
     item_inv rows and the consumer side in receiver documents. Case-folded,
     because the two were written by different flows. */
  const heldBySerial = new Map();
  asArray(receivers).forEach((receiver) => {
    const serial = key(receiver?.device?.serialNumber);
    if (serial) heldBySerial.set(serial, receiver);
  });

  const returning = asArray(view.matched).map((item) => ({
    itemId: item?.item_id ?? null,
    serial: text(item?.serial_number),
    group: text(item?.item_group) || "—",
    matchedVia: item?.matchedVia ?? null,
  }));

  /* `tagged` is null, not false, when the count could not know: a barcode
     sweep sees no tags at all. Saying "never tagged" there would tell the
     operator not to worry about a device that may carry a tag and have failed
     to answer — the alarm and the manual check swapped. */
  const tagKnown = view.tagKnown !== false;
  const missing = [
    ...asArray(view.missingTagged).map((item) => ({
      item,
      tagged: tagKnown ? true : null,
    })),
    ...asArray(view.missingUntagged).map((item) => ({
      item,
      tagged: tagKnown ? false : null,
    })),
  ];

  const disputed = [];

  const outstanding = missing.map(({ item, tagged }) => {
    const serial = text(item?.serial_number);
    const receiver = heldBySerial.get(key(serial));
    const consumer = receiver
      ? consumersByIntent?.[receiver.paymentIntent]
      : null;

    /* Missing from the sweep and held by nobody. Either it never left, or a
       return was recorded on one side and not the other. Reported rather than
       charged: there is no one to charge. */
    if (holdersKnown && !receiver) {
      disputed.push({
        serial,
        itemId: item?.item_id ?? null,
        reason: DISPUTE.NO_HOLDER,
        paymentIntent: null,
      });
    }

    return {
      itemId: item?.item_id ?? null,
      serial,
      group: text(item?.item_group) || text(receiver?.device?.deviceType) || "—",
      tagged,
      holder: holderName(consumer),
      email: consumer?.email ?? null,
      paymentIntent: receiver?.paymentIntent ?? null,
      value: money(receiver?.device?.deviceValue),
      /* Only a device someone actually holds can be charged for -- and null,
         not false, while the holder list is unknown. */
      chargeable: holdersKnown ? Boolean(receiver) : null,
      ambiguousWith: view.ambiguousByItem?.[item?.item_id]?.item_ids ?? null,
    };
  });

  /* The other direction, and the one that bills the wrong person: it came back
     to the shelf and the consumer record still shows it out. */
  if (holdersKnown) returning.forEach((row) => {
    const receiver = heldBySerial.get(key(row.serial));
    if (!receiver) return;
    disputed.push({
      serial: row.serial,
      itemId: row.itemId,
      reason: DISPUTE.RETURNED_BUT_ASSIGNED,
      paymentIntent: receiver.paymentIntent ?? null,
    });
  });

  return {
    returning,
    outstanding,
    disputed,
    totals: {
      expected: money(view.summary?.expected),
      returning: returning.length,
      outstanding: outstanding.length,
      outstandingValue: outstanding.reduce((sum, row) => sum + row.value, 0),
      chargeable: holdersKnown
        ? outstanding.filter((row) => row.chargeable).length
        : null,
    },
    /** Whether the consumer-side lookup answered at all. */
    holdersKnown,
    /**
     * Whether a count has happened at all — the one thing closing waits for.
     *
     * Deliberately not "the count came out clean". Blocking the close on
     * missing devices makes the operator choose between lying and not closing,
     * and the server closes partially by design. The gate is that somebody
     * counted, and that what is missing is on the record before it does.
     */
    counted,
  };
};
