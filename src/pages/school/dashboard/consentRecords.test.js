import { describe, expect, it } from "vitest";
import {
  CONSENT_LIST_MAX_PAGE_SIZE,
  CONSENT_LIST_STATUSES,
  buildConsentListPayload,
  consentDisplayName,
  consentRowLastActivity,
  effectiveConsentStatus,
  summarizeConsentTotals,
  ATTENTION_ORDER,
  describeConsentRecord,
  latestRecordByMember,
  sortAttentionRows,
  orphanConsentRows,
  resolveMemberConsentStatus,
  summarizeCoverage,
} from "./consentRecords";

describe("buildConsentListPayload", () => {
  it("sends only company_id when nothing else is asked for", () => {
    expect(buildConsentListPayload({ companyId: 42 })).toEqual({
      company_id: 42,
      page: 1,
      page_size: 50,
    });
  });

  it("adds the status filter when one is picked", () => {
    expect(buildConsentListPayload({ companyId: 42, status: "pending" }).status).toBe(
      "pending"
    );
  });

  it("omits the status for the all-records view rather than inventing one", () => {
    expect(buildConsentListPayload({ companyId: 42, status: "all" })).not.toHaveProperty(
      "status"
    );
    expect(buildConsentListPayload({ companyId: 42, status: null })).not.toHaveProperty(
      "status"
    );
  });

  it("refuses to send a status outside the server's whitelist", () => {
    // A status the server does not know is a 400 with the valid list, so it is
    // never worth sending.
    expect(buildConsentListPayload({ companyId: 42, status: "stale" })).not.toHaveProperty(
      "status"
    );
    expect(buildConsentListPayload({ companyId: 42, status: "missing" })).not.toHaveProperty(
      "status"
    );
  });

  it("covers exactly the four statuses the endpoint accepts", () => {
    expect(CONSENT_LIST_STATUSES).toEqual(["agreed", "pending", "refused", "expired"]);
  });

  it("clamps the page size to the server's maximum", () => {
    expect(buildConsentListPayload({ companyId: 42, pageSize: 5000 }).page_size).toBe(
      CONSENT_LIST_MAX_PAGE_SIZE
    );
  });

  it("sends whole numbers of at least one, which is all the server accepts", () => {
    // Non-integer or < 1 page/page_size is a 400.
    expect(buildConsentListPayload({ companyId: 42, page: 0 }).page).toBe(1);
    expect(buildConsentListPayload({ companyId: 42, page: 2.7 }).page).toBe(2);
    expect(buildConsentListPayload({ companyId: 42, pageSize: 0 }).page_size).toBe(1);
    expect(buildConsentListPayload({ companyId: 42, page: "x" }).page).toBe(1);
  });

  it("adds no field the endpoint does not declare", () => {
    expect(
      Object.keys(buildConsentListPayload({ companyId: 42, status: "agreed" })).sort()
    ).toEqual(["company_id", "page", "page_size", "status"]);
  });
});

describe("effectiveConsentStatus", () => {
  it("reads expiry off the server's boolean, not off the clock", () => {
    // `expired` is not a stored status: it is a pending row whose OTC window
    // has lapsed, and the server has already decided that.
    expect(
      effectiveConsentStatus({ status: "pending", expired: true, otc_expires_at: "2020-01-01" })
    ).toBe("expired");
  });

  it("leaves a live pending row pending", () => {
    expect(effectiveConsentStatus({ status: "pending", expired: false })).toBe("pending");
  });

  it("never expires a row that was already answered", () => {
    expect(effectiveConsentStatus({ status: "agreed", expired: true })).toBe("agreed");
    expect(effectiveConsentStatus({ status: "refused", expired: true })).toBe("refused");
  });

  it("survives a row with no status", () => {
    expect(effectiveConsentStatus({})).toBe("pending");
    expect(effectiveConsentStatus(undefined)).toBe("pending");
  });
});

describe("consentRowLastActivity", () => {
  it("follows the same precedence the server sorts by", () => {
    expect(
      consentRowLastActivity({
        consented_at: "2026-03-01",
        responded_at: "2026-02-01",
        requested_at: "2026-01-01",
        created_at: "2025-12-01",
      })
    ).toBe("2026-03-01");
  });

  it("falls back down the chain as each one is missing", () => {
    expect(
      consentRowLastActivity({ responded_at: "2026-02-01", created_at: "2025-12-01" })
    ).toBe("2026-02-01");
    expect(consentRowLastActivity({ requested_at: "2026-01-01" })).toBe("2026-01-01");
    expect(consentRowLastActivity({ created_at: "2025-12-01" })).toBe("2025-12-01");
  });

  it("is null when the row carries no date at all", () => {
    expect(consentRowLastActivity({})).toBeNull();
    expect(consentRowLastActivity(undefined)).toBeNull();
  });
});

describe("consentDisplayName", () => {
  it("names the student", () => {
    expect(consentDisplayName({ first_name: "Ada", last_name: "Lovelace" })).toBe(
      "Ada Lovelace"
    );
  });

  it("says the student is gone rather than rendering an empty cell", () => {
    // The student columns come from a LEFT JOIN, so a consent belonging to a
    // deleted student still appears with them null.
    expect(consentDisplayName({ first_name: null, last_name: null, member_id: 7 })).toBe(
      "Deleted student #7"
    );
  });

  it("copes with only half a name on file", () => {
    expect(consentDisplayName({ first_name: "Ada", last_name: null })).toBe("Ada");
  });
});

describe("summarizeConsentTotals", () => {
  it("adds the four filters up to the total, because they do not overlap", () => {
    // The server excludes expired rows from `pending` on purpose so these sum
    // without double counting.
    expect(
      summarizeConsentTotals({ agreed: 10, pending: 4, refused: 2, expired: 3 })
    ).toEqual({ agreed: 10, pending: 4, refused: 2, expired: 3, total: 19 });
  });

  it("treats a count that has not arrived as zero without hiding it", () => {
    const summary = summarizeConsentTotals({ agreed: 10 });
    expect(summary.pending).toBe(0);
    expect(summary.total).toBe(10);
  });

  it("survives nothing", () => {
    expect(summarizeConsentTotals(undefined).total).toBe(0);
  });
});

describe("latestRecordByMember", () => {
  it("keeps the first row for a student, which the server ordered as the newest", () => {
    // A student holds one row per policy version and per resend.
    const map = latestRecordByMember([
      { id: 9, member_id: 11, policy_version: "3", status: "pending" },
      { id: 4, member_id: 11, policy_version: "2", status: "agreed" },
      { id: 7, member_id: 12, status: "refused" },
    ]);
    expect(map.get(11).id).toBe(9);
    expect(map.size).toBe(2);
  });

  it("skips a row with no member and survives nothing", () => {
    expect(latestRecordByMember([{ id: 1 }]).size).toBe(0);
    expect(latestRecordByMember(undefined).size).toBe(0);
  });
});

describe("describeConsentRecord", () => {
  it("says when the request went out, not just that one is outstanding", () => {
    // "Awaiting guardian" covered both a request sent this morning and one
    // sent in March.
    const line = describeConsentRecord({
      status: "pending",
      expired: false,
      requested_at: "2026-03-04T10:00:00Z",
      signer_email: "mum@x.com",
      policy_version: "3",
    });
    expect(line).toContain("requested");
    expect(line).toContain("Mar");
    expect(line).toContain("asked mum@x.com");
    expect(line).toContain("policy v3");
  });

  it("dates an expired row by when the link died", () => {
    const line = describeConsentRecord({
      status: "pending",
      expired: true,
      requested_at: "2026-06-01T10:00:00Z",
      otc_expires_at: "2026-06-08T10:00:00Z",
    });
    expect(line).toContain("link expired");
    expect(line).toContain("Jun");
  });

  it("prefers the signer name over the email", () => {
    expect(
      describeConsentRecord({
        status: "refused",
        refused_at: "2026-05-01T10:00:00Z",
        signer_name: "Mary Lovelace",
        signer_email: "mary@x.com",
      })
    ).toContain("asked Mary Lovelace");
  });

  it("still reads when the row carries no dates at all", () => {
    expect(describeConsentRecord({ status: "refused" })).toBe("refused");
  });

  it("is null when there is no record, so the caller can omit the line", () => {
    expect(describeConsentRecord(null)).toBeNull();
  });
});

describe("sortAttentionRows", () => {
  const rows = [
    { name: "Zoe", status: "pending", flags: { under_13: false } },
    { name: "Ada", status: "missing", flags: { under_13: false } },
    { name: "Bea", status: "refused", flags: { under_13: true } },
    { name: "Cal", status: "pending", flags: { under_13: true } },
  ];

  it("puts under-13 first, because COPPA is the tighter obligation", () => {
    expect(sortAttentionRows(rows).slice(0, 2).map((r) => r.name)).toEqual([
      "Bea",
      "Cal",
    ]);
  });

  it("ranks the more stuck consent above the one merely waiting", () => {
    const older = sortAttentionRows(rows).filter((r) => !r.flags.under_13);
    expect(older.map((r) => r.name)).toEqual(["Ada", "Zoe"]);
  });

  it("orders missing worst and pending last", () => {
    expect(ATTENTION_ORDER[0]).toBe("missing");
    expect(ATTENTION_ORDER[ATTENTION_ORDER.length - 1]).toBe("pending");
  });

  it("falls back to the name and does not mutate the input", () => {
    const input = [
      { name: "B", status: "pending", flags: {} },
      { name: "A", status: "pending", flags: {} },
    ];
    expect(sortAttentionRows(input).map((r) => r.name)).toEqual(["A", "B"]);
    expect(input.map((r) => r.name)).toEqual(["B", "A"]);
  });

  it("survives nothing", () => {
    expect(sortAttentionRows(undefined)).toEqual([]);
  });
});

describe("resolveMemberConsentStatus", () => {
  it("reads the register row rather than waiting on the summary", () => {
    expect(
      resolveMemberConsentStatus({
        record: { status: "pending", expired: true },
        summaryStatus: undefined,
        registerComplete: true,
      })
    ).toBe("expired");
  });

  it("calls an agreement against a superseded policy stale", () => {
    expect(
      resolveMemberConsentStatus({
        record: { status: "agreed", policy_version: "2" },
        requiredPolicyVersion: "3",
        registerComplete: true,
      })
    ).toBe("stale");
  });

  it("leaves an agreement on the current policy alone", () => {
    expect(
      resolveMemberConsentStatus({
        record: { status: "agreed", policy_version: "3" },
        requiredPolicyVersion: "3",
        registerComplete: true,
      })
    ).toBe("agreed");
  });

  it("does not guess stale when the school has set no required version", () => {
    expect(
      resolveMemberConsentStatus({
        record: { status: "agreed", policy_version: "2" },
        requiredPolicyVersion: null,
        registerComplete: true,
      })
    ).toBe("agreed");
  });

  it("lets the summary mark a row stale even when the versions match", () => {
    expect(
      resolveMemberConsentStatus({
        record: { status: "agreed", policy_version: "3" },
        summaryStatus: "stale",
        requiredPolicyVersion: "3",
        registerComplete: true,
      })
    ).toBe("stale");
  });

  it("concludes nobody asked when the register is complete and holds no row", () => {
    expect(resolveMemberConsentStatus({ registerComplete: true })).toBe("missing");
  });

  it("falls back to the summary while the register cannot answer", () => {
    expect(
      resolveMemberConsentStatus({ summaryStatus: "agreed", registerComplete: false })
    ).toBe("agreed");
  });

  it("says it does not know rather than inventing an answer", () => {
    // This is the bug: an unknown read as "nothing to do", and the dashboard
    // reported a clean bill of health it had no data for.
    expect(resolveMemberConsentStatus({ registerComplete: false })).toBeNull();
    expect(resolveMemberConsentStatus()).toBeNull();
  });
});

describe("orphanConsentRows", () => {
  const records = [
    { id: 1, member_id: 11, status: "pending", expired: true, first_name: "Ada", last_name: "L" },
    { id: 2, member_id: 12, status: "agreed", first_name: "Zoe", last_name: "B" },
    { id: 3, member_id: 13, status: "refused", first_name: null, last_name: null },
  ];

  it("surfaces a bad record whose student is not on the roster", () => {
    // Otherwise the counts report an expired link that no row on screen shows.
    const rows = orphanConsentRows(records, []);
    expect(rows.map((row) => row.memberId).sort()).toEqual([11, 13]);
  });

  it("leaves out anyone the roster already covers", () => {
    expect(orphanConsentRows(records, [11]).map((row) => row.memberId)).toEqual([13]);
  });

  it("never lists an agreed record as needing attention", () => {
    expect(orphanConsentRows(records, []).some((row) => row.status === "agreed")).toBe(
      false
    );
  });

  it("names a deleted student and marks the row unlinkable", () => {
    const row = orphanConsentRows(records, []).find((r) => r.memberId === 13);
    expect(row.name).toBe("Deleted student #13");
    expect(row.orphan).toBe(true);
  });

  it("survives nothing", () => {
    expect(orphanConsentRows(undefined, undefined)).toEqual([]);
  });
});

describe("summarizeCoverage", () => {
  it("counts only the students it actually knows about", () => {
    expect(
      summarizeCoverage([
        { status: "agreed" },
        { status: "missing" },
        { status: null },
      ])
    ).toEqual({ requiring: 3, known: 2, unknown: 1, agreed: 1, coverage: 50 });
  });

  it("returns no coverage at all when nothing is known", () => {
    // It used to return 100 here, which is how a dashboard with no data told a
    // school it was fully compliant.
    const summary = summarizeCoverage([{ status: null }, { status: null }]);
    expect(summary.coverage).toBeNull();
    expect(summary.unknown).toBe(2);
    expect(summary.agreed).toBe(0);
  });

  it("survives nothing", () => {
    expect(summarizeCoverage(undefined)).toEqual({
      requiring: 0,
      known: 0,
      unknown: 0,
      agreed: 0,
      coverage: null,
    });
  });
});
