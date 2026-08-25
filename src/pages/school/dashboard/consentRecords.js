/**
 * Reading the company-wide consent register.
 *
 * `POST /api/school/consent/list` (added 2026-08-25) is the first endpoint that
 * answers "what consents exist for this company, in any state" — `/school/consent`
 * needs a member_id and `/school/consent/status` only says signed or not.
 *
 * Two things about the contract shape the code here:
 *
 *  - `expired` is not a stored status. It is a `pending` row whose one-time-code
 *    window has lapsed, and the server hands each row a computed `expired`
 *    boolean. There is no date arithmetic on this side, deliberately: the client
 *    clock and the server clock disagreeing must not change what a row says.
 *  - The four filters are mutually exclusive — `pending` excludes the expired —
 *    so the tab counts add up to the total with nothing counted twice.
 */

const STATUS_SET = Object.freeze(["agreed", "pending", "refused", "expired"]);

/** The only `status` values the endpoint accepts; anything else is a 400. */
export const CONSENT_LIST_STATUSES = STATUS_SET;

export const CONSENT_LIST_DEFAULT_PAGE_SIZE = 50;
export const CONSENT_LIST_MAX_PAGE_SIZE = 200;

/** A whole number of at least `min` — page and page_size are 400 otherwise. */
const wholeNumber = (value, fallback, { min = 1, max = Infinity } = {}) => {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

/**
 * The body of `POST /api/school/consent/list`.
 *
 * `status` is left out entirely for the all-records view, and dropped rather
 * than forwarded when it is not one the server knows — a status outside the
 * whitelist comes back 400, which is a worse outcome than showing everything.
 */
export function buildConsentListPayload({ companyId, status, page, pageSize } = {}) {
  const payload = {
    company_id: companyId,
    page: wholeNumber(page, 1),
    page_size: wholeNumber(pageSize, CONSENT_LIST_DEFAULT_PAGE_SIZE, {
      max: CONSENT_LIST_MAX_PAGE_SIZE,
    }),
  };

  if (STATUS_SET.includes(status)) payload.status = status;
  return payload;
}

/**
 * What a row's status actually is on screen.
 *
 * A lapsed request still carries `status: "pending"`, so the server's `expired`
 * flag is what separates "waiting on the guardian" from "the link died and
 * somebody has to resend it". Only a pending row can expire — an answered one
 * stays answered.
 */
export function effectiveConsentStatus(row) {
  const status = row?.status || "pending";
  if (status === "pending" && row?.expired) return "expired";
  return status;
}

/**
 * The most recent thing that happened to this consent.
 *
 * Same precedence the server sorts by, so the column the rows are ordered on is
 * the column the table shows.
 */
export function consentRowLastActivity(row) {
  return (
    row?.consented_at ?? row?.responded_at ?? row?.requested_at ?? row?.created_at ?? null
  );
}

/**
 * The student's name, or a marker that they are gone.
 *
 * Name and grade come from a LEFT JOIN with members_info, so a consent that
 * outlived its student arrives with them null. Rendering that as an empty cell
 * reads as a loading bug.
 */
export function consentDisplayName(row) {
  const name = `${row?.first_name ?? ""} ${row?.last_name ?? ""}`.trim();
  if (name) return name;
  return `Deleted student #${row?.member_id ?? "?"}`;
}

/** The four counts and their sum. They do not overlap, so the sum is the total. */
export function summarizeConsentTotals(countsByStatus) {
  const counts = countsByStatus ?? {};
  const summary = {};
  let total = 0;

  STATUS_SET.forEach((status) => {
    const count = Number(counts[status]) || 0;
    summary[status] = count;
    total += count;
  });

  return { ...summary, total };
}

/* ──────────────────────────────────── feeding the needs-attention list ──── */

/**
 * The statuses that put a student on the needs-attention list, worst first.
 *
 * `missing` and `stale` come from /school/consent/status, which is the only
 * thing that knows about a student with no record at all or one whose signed
 * policy version has been superseded. The register cannot answer either
 * question: it lists the rows that exist.
 */
export const ATTENTION_ORDER = Object.freeze([
  "missing",
  "refused",
  "expired",
  "stale",
  "pending",
]);

/**
 * The latest consent row per student.
 *
 * The endpoint returns rows already ordered by the most recent lifecycle date,
 * and a student can hold several — one per policy version and per resend — so
 * the first row seen for a member is the current one.
 */
export function latestRecordByMember(records) {
  const byMember = new Map();
  (Array.isArray(records) ? records : []).forEach((row) => {
    const memberId = row?.member_id;
    if (memberId === undefined || memberId === null) return;
    if (!byMember.has(memberId)) byMember.set(memberId, row);
  });
  return byMember;
}

const shortDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
};

/**
 * One line of detail for an attention row, or null when there is no record.
 *
 * The list used to show the status and nothing else, so "Awaiting guardian"
 * covered both a request sent this morning and one sent in March. This says
 * which, and who was asked.
 */
export function describeConsentRecord(row) {
  if (!row) return null;

  const status = effectiveConsentStatus(row);
  const who = row.signer_name || row.signer_email;
  const version = row.policy_version ? `policy v${row.policy_version}` : null;

  const when = {
    refused: shortDate(row.refused_at ?? row.responded_at),
    expired: shortDate(row.otc_expires_at),
    pending: shortDate(row.requested_at),
    agreed: shortDate(row.consented_at),
  }[status];

  const lead = {
    refused: when ? `refused ${when}` : "refused",
    expired: when ? `link expired ${when}` : "link expired",
    pending: when ? `requested ${when}` : "requested",
    agreed: when ? `agreed ${when}` : "agreed",
  }[status];

  return [lead, who ? `asked ${who}` : null, version].filter(Boolean).join(" · ");
}

/**
 * Sorts the needs-attention list: under-13 first because COPPA is the tighter
 * obligation, then by how stuck the consent is, then by name.
 */
export function sortAttentionRows(rows) {
  return [...(Array.isArray(rows) ? rows : [])].sort((a, b) => {
    if (Boolean(a?.flags?.under_13) !== Boolean(b?.flags?.under_13)) {
      return a?.flags?.under_13 ? -1 : 1;
    }
    const rank = (row) => {
      const index = ATTENTION_ORDER.indexOf(row?.status);
      return index === -1 ? ATTENTION_ORDER.length : index;
    };
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    return String(a?.name ?? "").localeCompare(String(b?.name ?? ""));
  });
}

/* ─────────────────────────────────── one student's consent, resolved ────── */

/**
 * What a student's consent actually is, from the register first.
 *
 * The dashboard used to take this only from /school/consent/status. When that
 * summary came back empty the code read every student as "unknown", dropped
 * them all from the counts, and then reported 100% coverage and "no
 * outstanding consent actions" — a clean bill of health derived from no data
 * at all, while the register plainly held an expired link. Absence of an
 * answer is not an answer, and it is never good news.
 *
 * Precedence:
 *  - a register row wins, because it is the record itself;
 *  - an agreed row against a superseded policy version is `stale`, since the
 *    school still needs a fresh signature;
 *  - with no row and a complete register, the student was never asked;
 *  - with no row and an incomplete register, fall back to the summary;
 *  - otherwise null, meaning we do not know — which the caller must show as
 *    not knowing.
 *
 * @returns {string|null}
 */
export function resolveMemberConsentStatus({
  record,
  summaryStatus,
  requiredPolicyVersion,
  registerComplete,
} = {}) {
  if (record) {
    const status = effectiveConsentStatus(record);
    if (summaryStatus === "stale") return "stale";
    if (
      status === "agreed" &&
      requiredPolicyVersion &&
      record.policy_version &&
      String(record.policy_version) !== String(requiredPolicyVersion)
    ) {
      return "stale";
    }
    return status;
  }

  if (registerComplete) return "missing";
  return summaryStatus ?? null;
}

/**
 * Register rows that need acting on but belong to nobody on the roster.
 *
 * A consent can outlive the student who needed it — they left, they turned 18,
 * the record was deleted — and the roster-driven list would then never show it
 * while the counts above kept reporting it. Anything the register says is
 * pending, expired or refused has to be visible somewhere.
 */
export function orphanConsentRows(records, coveredMemberIds) {
  const covered = new Set(coveredMemberIds ?? []);
  const rows = [];

  latestRecordByMember(records).forEach((record, memberId) => {
    if (covered.has(memberId)) return;
    const status = effectiveConsentStatus(record);
    if (status === "agreed") return;

    rows.push({
      memberId,
      name: consentDisplayName(record),
      grade: record.grade ?? null,
      status,
      record,
      flags: {},
      // Not on the roster, so there is no student page to open.
      orphan: true,
    });
  });

  return rows;
}

/**
 * The consent numbers for the tiles, with what is not known kept separate.
 *
 * `coverage` is null rather than 100 when nothing is known: a percentage
 * invented from an empty set is the specific thing that told the school it was
 * compliant when the dashboard had simply failed to load.
 */
export function summarizeCoverage(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const known = list.filter((row) => row?.status !== null && row?.status !== undefined);
  const agreed = known.filter((row) => row.status === "agreed");

  return {
    requiring: list.length,
    known: known.length,
    unknown: list.length - known.length,
    agreed: agreed.length,
    coverage: known.length
      ? Math.round((agreed.length / known.length) * 100)
      : null,
  };
}
