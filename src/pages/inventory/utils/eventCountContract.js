/**
 * The client side of `POST /api/db_event/event-count/*`.
 *
 * Contract: `FRONTEND_rfid_event_count_endpoints.md`. Everything here is pure —
 * building the request and reading the answer — so the rules the contract calls
 * non-negotiable are pinned by tests instead of living inside a component.
 *
 * **This does not replace `checkInFromEvent`.** There are two ways to close an
 * event now and both stay: the older one reconciles serials in the browser and
 * posts `confirm-item-return`, and §6 of the contract is explicit that
 * `return-event-devices` is not going away. This is the identifier path, where
 * the server owns the resolution because only it can turn a tag into an item.
 *
 * The three rules from §4 of the contract, and why each one is here:
 *
 *   - `missing_tagged` and `missing_untagged` are different things. A tagged
 *     device that stayed silent is an alarm; an untagged one is a manual check.
 *     Merged into one "missing" list, the screen fills with false alarms for as
 *     long as the RFID rollout lasts, and the operator learns to ignore them.
 *   - `ambiguous` is **not** a sixth state. Those devices are already counted in
 *     `missing_*`; adding them again reports six devices out of five.
 *   - `foreign` is a device of this company from another event — actionable.
 *     `unknown` is not ours at all.
 */

/** §1.3 — and the one ceiling in this contract that must not be chunked. */
export const MAX_SCANNED = 2000;

/**
 * What a row on the count screen can be.
 *
 * Five, not six: see the note about `ambiguous` above.
 */
export const COUNT_STATUS = {
  MISSING_TAGGED: "missing_tagged",
  MISSING_UNTAGGED: "missing_untagged",
  FOREIGN: "foreign",
  UNKNOWN: "unknown",
  MATCHED: "matched",
};

/** Still-looking-for first; done last. */
const STATUS_ORDER = [
  COUNT_STATUS.MISSING_TAGGED,
  COUNT_STATUS.MISSING_UNTAGGED,
  COUNT_STATUS.FOREIGN,
  COUNT_STATUS.UNKNOWN,
  COUNT_STATUS.MATCHED,
];

const asArray = (value) => (Array.isArray(value) ? value : []);
const text = (value) => String(value ?? "").trim();

/**
 * The body for `reconcile` and for `close`, which take the same request.
 *
 * Values are trimmed, uppercased and deduplicated here — the same
 * normalisation §1.4 says the server applies — so the count checked against the
 * ceiling is the count the server will see. A tag read in two casings must not
 * spend two of the 2000 slots on one device.
 *
 * @param {{eventId: number, companyId: number, codes: string[]}} args
 * @returns {{request: object|null, error: {code: string}|null}}
 */
export const buildCountRequest = ({ eventId, companyId, codes } = {}) => {
  if (!eventId || !companyId) {
    return { request: null, error: { code: "missing-context" } };
  }

  const seen = new Set();
  const scanned = [];
  asArray(codes).forEach((code) => {
    const value = text(code).toUpperCase();
    if (!value || seen.has(value)) return;
    seen.add(value);
    scanned.push(value);
  });

  if (scanned.length === 0) {
    return { request: null, error: { code: "nothing-scanned" } };
  }

  /* Chunking is not supported by this endpoint and the reason is worth keeping
     next to the check: `missing` is expected minus scanned, so a partial batch
     reports devices as lost that are sitting in the box, with no error. */
  if (scanned.length > MAX_SCANNED) {
    return {
      request: null,
      error: {
        code: "too-many-scanned",
        count: scanned.length,
        limit: MAX_SCANNED,
      },
    };
  }

  /* company_id goes in the body as well as the header: the permission
     middleware reads the body and the context resolver prefers the header, so
     sending one without the other is a 400 (§1.2). */
  return {
    request: { event_id: eventId, company_id: companyId, scanned },
    error: null,
  };
};

/**
 * The response as the screen wants it.
 *
 * Tolerates a malformed payload with an empty shell rather than throwing: this
 * is read straight off the wire, and a count screen that crashes mid-sweep
 * loses the sweep.
 *
 * @param {object} data - the endpoint's body
 */
export const readCountResponse = (data) => {
  const payload = data && typeof data === "object" ? data : {};
  const raw = payload.summary && typeof payload.summary === "object"
    ? payload.summary
    : {};

  const number = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
  const summary = {
    expected: number(raw.expected),
    scanned: number(raw.scanned),
    matched: number(raw.matched),
    missing: number(raw.missing),
    foreign: number(raw.foreign),
    unknown: number(raw.unknown),
    ambiguous: number(raw.ambiguous),
  };

  const ambiguous = asArray(payload.ambiguous);
  /* Keyed by item so a missing row can say which devices its value could be.
     The operator holding one of them is the only one who can tell them apart. */
  const ambiguousByItem = {};
  ambiguous.forEach((entry) => {
    asArray(entry?.item_ids).forEach((itemId) => {
      ambiguousByItem[itemId] = entry;
    });
  });

  /* The invariant the contract states. If it fails, the payload disagrees with
     itself and nothing may claim a finished count off it. */
  const balanced = summary.matched + summary.missing === summary.expected;

  return {
    ok: payload.ok === true,
    summary,
    matched: asArray(payload.matched),
    missingTagged: asArray(payload.missing_tagged),
    missingUntagged: asArray(payload.missing_untagged),
    foreign: asArray(payload.foreign),
    unknown: asArray(payload.unknown),
    ambiguous,
    ambiguousByItem,
    balanced,
    complete: balanced && summary.expected > 0 && summary.missing === 0,
  };
};

/** One device per row, with what was scanned and did not belong underneath. */
const deviceRow = (item, status, ambiguousByItem) => {
  const itemId = item?.item_id ?? null;
  const entry = itemId == null ? undefined : ambiguousByItem[itemId];

  return {
    key: `${status}-${itemId}`,
    status,
    itemId,
    serial: text(item?.serial_number),
    group: text(item?.item_group) || "—",
    category: text(item?.category_name) || "—",
    epc: item?.epc ?? null,
    value: text(item?.matchedBy) || null,
    matchedVia: item?.matchedVia ?? null,
    /* An annotation, not a status: this device is missing *because* its code
       could be one of several. The siblings are what the screen offers to
       choose between. */
    ambiguousValue: entry?.value ?? null,
    ambiguousWith: entry
      ? asArray(entry.item_ids).filter((id) => id !== itemId)
      : null,
  };
};

/**
 * Rows for the count table, ordered by what the operator still has to do.
 *
 * @param {ReturnType<typeof readCountResponse>} view
 */
export const countRows = (view) => {
  if (!view) return [];
  const { ambiguousByItem = {} } = view;

  const rows = [
    ...asArray(view.missingTagged).map((item) =>
      deviceRow(item, COUNT_STATUS.MISSING_TAGGED, ambiguousByItem)
    ),
    ...asArray(view.missingUntagged).map((item) =>
      deviceRow(item, COUNT_STATUS.MISSING_UNTAGGED, ambiguousByItem)
    ),
    ...asArray(view.foreign).map((entry) => ({
      key: `${COUNT_STATUS.FOREIGN}-${text(entry?.id_value)}`,
      status: COUNT_STATUS.FOREIGN,
      itemId: entry?.item_id ?? null,
      serial: "",
      group: "—",
      category: "—",
      epc: null,
      value: text(entry?.id_value),
      matchedVia: null,
      ambiguousValue: null,
      ambiguousWith: null,
    })),
    ...asArray(view.unknown).map((value) => ({
      key: `${COUNT_STATUS.UNKNOWN}-${text(value)}`,
      status: COUNT_STATUS.UNKNOWN,
      itemId: null,
      serial: "",
      group: "—",
      category: "—",
      epc: null,
      value: text(value),
      matchedVia: null,
      ambiguousValue: null,
      ambiguousWith: null,
    })),
    ...asArray(view.matched).map((item) =>
      deviceRow(item, COUNT_STATUS.MATCHED, ambiguousByItem)
    ),
  ];

  return rows.sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
  );
};

/**
 * What a bulk registration actually did.
 *
 * `register-bulk` answers **200 with `ok: true`** even when every entry
 * conflicted (§2.2): the batch was processable, which is not the same as the
 * labels being registered. Gating on `data.ok` would report a finished
 * labelling run that labelled nothing — the same class of bug as a refused
 * write passing for a completed handover, which this repo has already paid for
 * twice.
 *
 * @param {object} data
 * @returns {{registered: number, conflicts: object[], rejected: object[],
 *   failed: number, allFailed: boolean, partial: boolean}}
 */
export const readBulkRegisterOutcome = (data) => {
  const payload = data && typeof data === "object" ? data : {};
  const registered = Number.isFinite(Number(payload.registered))
    ? Number(payload.registered)
    : 0;
  const conflicts = asArray(payload.conflicts);
  const rejected = asArray(payload.rejected);
  const failed = conflicts.length + rejected.length;

  return {
    registered,
    conflicts,
    rejected,
    failed,
    allFailed: registered === 0 && failed > 0,
    partial: registered > 0 && failed > 0,
  };
};
