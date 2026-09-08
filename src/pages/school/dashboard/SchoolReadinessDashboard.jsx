import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import { Button, Modal, message } from "antd";
import { devitrakApi } from "../../../api/devitrakApi";
import { fetchSchoolSettings } from "../../Profile/school_compliance/utils/schoolComplianceUtils";
import {
  fetchCompanyConsents,
  fetchConsentStatusSummary,
} from "../../conditionalPage/utils/guardianConsentApi";
import { getConsentStatusCopy } from "../../conditionalPage/utils/guardianConsentUtils";
import { calculateStudentAgeFlags } from "../../conditionalPage/utils/ageCalculationUtils";
import { loadDemoData } from "../compliance/loadDemoData";
import ConsentAttentionList from "./ConsentAttentionList";
import ConsentEnforcementCallout from "./ConsentEnforcementCallout";
import "./consentAttention.css";
import {
  buildConsentListPayload,
  describeConsentRecord,
  latestRecordByMember,
  orphanConsentRows,
  resolveMemberConsentStatus,
  sortAttentionRows,
  summarizeConsentTotals,
  summarizeCoverage,
} from "./consentRecords";

/**
 * School compliance-readiness dashboard.
 *
 * District-wide view of FERPA/COPPA readiness, built on the real server
 * contract: /school/settings for enforcement + required policy version,
 * date_of_birth on the member record for derived minor/under-13 status, and
 * /school/consent per student for the guardian-consent state (missing |
 * pending | agreed | refused | expired | stale).
 *
 * Consent is only fetched for students who actually require it (minors by DOB)
 * and only while enforcement is on, so the roster doesn't trigger needless
 * per-student requests.
 */
const tile = {
  flex: "1 1 160px",
  minWidth: 0,
  background: "var(--base-white, #fff)",
  border: "1px solid var(--gray-200, #ddded6)",
  borderRadius: "var(--radius-xl, 12px)",
  boxShadow: "var(--shadow-xs)",
  padding: "16px 20px",
  textAlign: "left",
};
const label = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 500,
  color: "var(--gray-600, #5d615a)",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};
const value = {
  margin: "6px 0 0",
  fontFamily: "Inter, sans-serif",
  fontSize: "28px",
  lineHeight: "36px",
  fontWeight: 600,
  color: "var(--gray-900, #171d1a)",
};
const caption = {
  margin: "2px 0 0",
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  color: "var(--gray-500, #777b73)",
};

const chip = (bg, fg) => ({
  display: "inline-block",
  fontSize: 12,
  fontWeight: 600,
  padding: "2px 10px",
  borderRadius: 9999,
  background: bg,
  color: fg,
  whiteSpace: "nowrap",
});

const ERROR_CHIP = chip("var(--error-50, #fef3f2)", "var(--error-700, #b42318)");
const WARN_CHIP = chip("var(--warning-50, #fffaeb)", "var(--warning-700, #b54708)");
const OK_CHIP = chip("var(--success-50, #ecfdf3)", "var(--success-700, #067647)");
const NEUTRAL_CHIP = chip("var(--gray-100, #f2f4f7)", "var(--gray-600, #475467)");

// The status pills moved into ConsentAttentionList, which owns the list now.

const SchoolReadinessDashboard = ({ audienceLabel = "students" }) => {
  const { user } = useSelector((state) => state.admin);
  const companyId = user?.sqlInfo?.company_id;
  const isEducation = user?.companyData?.industry === "Education";
  // Seeder controls only appear on the Summit demo company.
  const isDemoCompany = String(companyId) === "3";

  const membersQuery = useQuery({
    queryKey: ["membersInfoQuery"],
    queryFn: () =>
      devitrakApi.post("/db_member/consulting-member", { company_id: companyId }),
    enabled: !!companyId,
  });
  const outstandingQuery = useQuery({
    queryKey: ["outstandingLeasesCount", companyId],
    queryFn: () =>
      devitrakApi.post("/db_member/retrieve-members-assigned-devices", {
        company_id: companyId,
        returned: 0,
      }),
    enabled: !!companyId,
  });
  const overdueQuery = useQuery({
    queryKey: ["overdueLeasesQuery", companyId],
    queryFn: () =>
      devitrakApi.post("/db_member/overdue-leases", { company_id: companyId }),
    enabled: !!companyId,
  });
  const settingsQuery = useQuery({
    queryKey: ["schoolSettings", companyId],
    queryFn: () => fetchSchoolSettings(companyId),
    enabled: !!companyId && isEducation,
    staleTime: 5 * 60 * 1000,
  });

  const membersData = membersQuery?.data?.data?.members;
  const devicesOut = outstandingQuery?.data?.data?.rows?.length ?? 0;
  const overdue = overdueQuery?.data?.data?.count ?? 0;
  const settings = settingsQuery.data?.settings || {};
  const enforcementOn = Boolean(settings.enforce_member_consent || settings.enforce_under_13_consent
);
  const requiredPolicyVersion = settings.required_consent_policy_version ?? null;

  // Students whose age (from DOB) means guardian consent is in scope.
  const roster = useMemo(() => {
    const members = membersData || [];
    return members.map((m) => {
      const memberId = m.member_id ?? m.id;
      const flags = calculateStudentAgeFlags(m.date_of_birth);
      // Fall back to the legacy flag when no DOB is on file yet.
      const isMinor = flags.dob_valid ? flags.minor : Number(m.minor) === 1;
      return { member: m, memberId, flags, isMinor };
    });
  }, [membersData]);

  const consentTargets = useMemo(
    () => (enforcementOn ? roster.filter((r) => r.isMinor) : []),
    [roster, enforcementOn]
  );

  // One request for the whole district. This used to be a useQueries fan-out —
  // one /school/consent per minor, ~961 on the demo district — which stayed
  // invisible only because it's gated on enforcement being on, i.e. it fired
  // for the first time during the demo it was built for.
  const consentSummaryQuery = useQuery({
    queryKey: ["schoolConsentStatus", companyId, requiredPolicyVersion],
    queryFn: () =>
      fetchConsentStatusSummary(companyId, {
        policyVersion: requiredPolicyVersion,
      }),
    enabled: !!companyId && isEducation && enforcementOn,
    staleTime: 60 * 1000,
  });

  const consentLoading = enforcementOn && consentSummaryQuery.isLoading;
  const consentStatuses = consentSummaryQuery.data?.statuses;

  // The consent register (/school/consent/list, 2026-08-25). It answers a
  // different question from the summary above: the summary says whether a
  // *student* is covered, this says what consent *records* exist and in what
  // state. Both are needed here -- the register cannot report a student who was
  // never asked (no row exists) or one whose signed policy version has been
  // superseded, and the summary cannot say when a request went out or who it
  // went to.
  //
  // One request per state rather than one unfiltered page: the server's filters
  // are mutually exclusive (`pending` excludes the expired), so each response's
  // `total` is that state's true company-wide count and they add up. Four cheap
  // requests, cached -- the read is written to the PII audit, so it must not be
  // polled.
  const REGISTER_STATES = ["agreed", "pending", "expired", "refused"];
  const REGISTER_DETAIL_PAGE = 200;
  const registerQueries = useQueries({
    queries: REGISTER_STATES.map((status) => ({
      queryKey: ["consentRegister", companyId, status],
      queryFn: () =>
        fetchCompanyConsents(
          buildConsentListPayload({
            companyId,
            status,
            page: 1,
            pageSize: REGISTER_DETAIL_PAGE,
          })
        ),
      enabled: !!companyId && isEducation,
      staleTime: 60 * 1000,
    })),
  });

  const registerByStatus = Object.fromEntries(
    REGISTER_STATES.map((status, index) => [status, registerQueries[index]?.data])
  );
  const registerCounts = summarizeConsentTotals(
    Object.fromEntries(
      REGISTER_STATES.map((status) => [status, registerByStatus[status]?.total])
    )
  );
  const registerLoading = registerQueries.some((query) => query.isLoading);
  const registerFailed = registerQueries.some((query) => query.isError);

  // Past REGISTER_DETAIL_PAGE rows in any state we no longer hold the whole
  // register, and "this student has no row" stops meaning "nobody asked them".
  const registerTruncated = REGISTER_STATES.some(
    (status) => (registerByStatus[status]?.total ?? 0) > REGISTER_DETAIL_PAGE
  );
  const registerLoaded = registerQueries.every((query) => query.isSuccess);
  // Only a register we hold in full can prove a student was never asked.
  const registerComplete = registerLoaded && !registerTruncated;

  const registerRows = useMemo(
    () => [
      // Worst state first so that, where a student holds rows in more than one,
      // the row kept is the one that needs acting on.
      ...(registerByStatus.refused?.consents ?? []),
      ...(registerByStatus.expired?.consents ?? []),
      ...(registerByStatus.pending?.consents ?? []),
      ...(registerByStatus.agreed?.consents ?? []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      registerByStatus.refused,
      registerByStatus.expired,
      registerByStatus.pending,
      registerByStatus.agreed,
    ]
  );
  const recordsByMember = useMemo(
    () => latestRecordByMember(registerRows),
    [registerRows]
  );

  const { kpis, attention } = useMemo(() => {
    const rows = consentTargets.map((r) => {
      const record = recordsByMember.get(r.memberId) ?? null;
      return {
        ...r,
        name: `${r.member.first_name ?? ""} ${r.member.last_name ?? ""}`.trim(),
        grade: r.member.grade ?? null,
        record,
        // The register first, the summary only where the register cannot
        // answer, and null when neither can — see resolveMemberConsentStatus.
        status: resolveMemberConsentStatus({
          record,
          summaryStatus: consentStatuses?.[r.memberId],
          requiredPolicyVersion,
          registerComplete,
        }),
      };
    });

    const under13 = roster.filter((r) => r.flags.under_13);
    const coverage = summarizeCoverage(rows);

    // Anything still outstanding, plus the register rows that need acting on
    // but belong to nobody on the roster — a student who left, turned 18 or
    // was deleted. Those used to be counted in the header and shown nowhere.
    const outstanding = rows.filter(
      (r) => r.status !== null && r.status !== "agreed"
    );
    const orphans = orphanConsentRows(
      registerRows,
      consentTargets.map((r) => r.memberId)
    );

    // under-13 first (COPPA), then by how stuck the consent is, then by name
    const attentionRows = sortAttentionRows([...outstanding, ...orphans]);

    return {
      kpis: {
        total: roster.length,
        under13: under13.length,
        // requiring / known / unknown / agreed / coverage
        ...coverage,
      },
      attention: attentionRows,
    };
    // consentStatuses is a stable object reference from react-query's cache, so
    // it can be a plain dependency. The previous fan-out had to stringify every
    // consent payload on every render to get a comparable key.
  }, [
    roster,
    consentTargets,
    consentStatuses,
    recordsByMember,
    registerRows,
    registerComplete,
    requiredPolicyVersion,
  ]);

  /* Those on record who have not agreed yet. `unknown` is counted separately
     -- it is what could not be read, not what is outstanding -- so the two
     never double count. */
  const pendingConsent = Math.max(0, kpis.known - kpis.agreed);

  const coverageColor =
    kpis.coverage === null
      ? "var(--gray-500, #777b73)"
      : kpis.coverage >= 100
      ? "var(--success-600, #079455)"
      : kpis.coverage >= 60
      ? "var(--warning-600, #dc6803)"
      : "var(--error-600, #d92d20)";

  const runSeed = () => {
    Modal.confirm({
      title: "Load Summit demo roster?",
      content:
        "Creates any missing demo students (12 total) on this company with their date of birth, and links a guardian for each minor. Safe to run again — existing students are skipped. No consent emails are sent.",
      okText: "Load demo roster",
      onOk: async () => {
        try {
          const s = await loadDemoData({ companyId });
          await membersQuery.refetch();
          const msg = `Roster loaded — ${s.created} created, ${s.ensured} already present, ${s.guardiansLinked} guardians linked.`;
          if (s.errors.length) {
            console.warn("Demo seed issues:", s.errors);
            message.warning(`${msg} ${s.errors.length} issue(s) — see console.`);
          } else {
            message.success(msg);
          }
        } catch (e) {
          message.error(`Demo seed failed: ${e.message}`);
        }
      },
    });
  };

  return (
    <div style={{ width: "100%", margin: "0 0 8px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          margin: "0 0 12px",
          flexWrap: "wrap",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "Inter, sans-serif",
            fontSize: "18px",
            fontWeight: 600,
            color: "var(--gray-900, #171d1a)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon icon="tabler:shield-check" width={20} /> Compliance readiness
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {isDemoCompany && (
            <Button size="small" type="primary" onClick={runSeed}>
              Load demo roster
            </Button>
          )}
        </div>
      </div>

      {!isEducation && (
        <div style={{ ...caption, margin: "0 0 12px" }}>
          Compliance tracking applies to Education companies.
        </div>
      )}

      {/* What enforcement is and where to switch it on. Replaces a grey pill
          that said "Consent enforcement off" and left the reader with no way to
          find out what that meant or how to change it. */}
      {isEducation && !settingsQuery.isLoading && (
        <ConsentEnforcementCallout
          enforcementOn={enforcementOn}
          requiredPolicyVersion={requiredPolicyVersion}
          audienceLabel={audienceLabel}
        />
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          width: "100%",
          margin: "0 0 16px",
        }}
      >
        <div style={tile}>
          <p style={label}>
            <Icon icon="tabler:users" width={16} /> Total {audienceLabel}
          </p>
          <p style={value}>{kpis.total}</p>
        </div>
        <div style={tile}>
          <p style={label}>
            <Icon icon="tabler:baby-carriage" width={16} /> Under 13
          </p>
          <p style={value}>{kpis.under13}</p>
          <p style={caption}>COPPA guardian consent applies</p>
        </div>
        <div style={tile}>
          <p style={label}>
            <Icon icon="tabler:writing-sign" width={16} /> Minors who agreed
          </p>
          {/* The headline is the count, not the percentage: "37 of 42" is the
              number somebody is asked for. It counts STUDENTS, not register
              rows — a student holds one row per policy version and per resend,
              so the register's agreed total is a larger number answering a
              different question.

              When nothing could be read this shows a dash. It used to show
              0/20 next to "100% coverage" and a celebratory empty list, all
              three derived from an empty response. */}
          <p style={{ ...value, color: coverageColor }}>
            {consentLoading || registerLoading
              ? "…"
              : kpis.known === 0
              ? "—"
              : `${kpis.agreed}/${kpis.requiring}`}
          </p>
          <p style={caption}>
            {!enforcementOn
              ? "enforcement is off"
              : consentLoading || registerLoading
              ? "reading consent records…"
              : kpis.known === 0
              ? "consent records could not be read"
              : /* The percentage is the share that HAS agreed, which is what
                   the count above it and the colour of both are built on. It
                   used to read "88% of minors requiring consent", where
                   "requiring consent" parses as "still requiring it" -- so the
                   number said 88 had signed and the sentence said 88 had not.
                   It names what it counts now, and states what is outstanding
                   rather than leaving it to be worked out. */
                `${kpis.coverage}% agreed${
                  pendingConsent > 0 ? ` · ${pendingConsent} still to sign` : ""
                }${kpis.unknown > 0 ? ` · ${kpis.unknown} unread` : ""}`}
          </p>
        </div>
        <div style={tile}>
          <p style={label}>
            <Icon icon="tabler:device-laptop" width={16} /> Devices out
          </p>
          <p style={value}>{devicesOut}</p>
        </div>
        <div style={tile}>
          <p style={label}>
            <Icon icon="tabler:alarm" width={16} /> Overdue
          </p>
          <p
            style={{
              ...value,
              color:
                overdue > 0
                  ? "var(--error-600, #b8452a)"
                  : "var(--gray-900, #171d1a)",
            }}
          >
            {overdue}
          </p>
        </div>
      </div>

      {/* Needs-attention list */}
      <div
        style={{
          background: "var(--base-white, #fff)",
          border: "1px solid var(--gray-200, #ddded6)",
          borderRadius: "var(--radius-xl, 12px)",
          boxShadow: "var(--shadow-xs)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--gray-200, #ddded6)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <Icon
            icon="tabler:alert-triangle"
            width={18}
            color={
              attention.length
                ? "var(--warning-600, #dc6803)"
                : "var(--success-600, #079455)"
            }
          />
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 15,
              fontWeight: 600,
              color: "var(--gray-900, #171d1a)",
            }}
          >
            Needs attention
          </span>
          <span style={caption}>
            {consentLoading || registerLoading
              ? "reading consent records…"
              : attention.length
              ? `${attention.length} outstanding${
                  kpis.unknown > 0 ? ` · ${kpis.unknown} could not be read` : ""
                }`
              : !enforcementOn
              ? "consent enforcement is off"
              : kpis.known === 0
              ? "consent records could not be read"
              : "every student requiring consent has agreed"}
          </span>
        </div>

        {/* The consent register, in the header rather than as a second table:
            these are counts of consent RECORDS company-wide, which is not the
            same number as the list below. A student can hold several rows, and
            a record whose student has since been deleted still counts here
            while having nobody left to chase. */}
        <div
          style={{
            padding: "10px 20px",
            borderBottom: "1px solid var(--gray-200, #ddded6)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span style={{ ...caption, margin: 0 }}>Consent records on file</span>
          {registerFailed ? (
            <span style={WARN_CHIP}>register unavailable</span>
          ) : registerLoading ? (
            <span style={NEUTRAL_CHIP}>loading…</span>
          ) : registerCounts.total === 0 ? (
            <span style={NEUTRAL_CHIP}>none yet</span>
          ) : (
            <>
              <span style={OK_CHIP}>{registerCounts.agreed} agreed</span>
              <span style={WARN_CHIP}>{registerCounts.pending} awaiting</span>
              <span style={ERROR_CHIP}>{registerCounts.expired} expired</span>
              <span style={ERROR_CHIP}>{registerCounts.refused} refused</span>
              <span style={{ ...caption, margin: 0 }}>
                {registerCounts.total} total
                {registerTruncated ? " · detail shown for the first 200 of each" : ""}
              </span>
            </>
          )}
        </div>

        {consentLoading || registerLoading ? (
          <p className="consent-attention__empty">Loading…</p>
        ) : registerFailed || kpis.known === 0 ? (
          /* Only celebrate on an answer. An empty list because nothing could be
             read is not the same as an empty list because there is nothing to
             do, and the second message was being shown for the first case. */
          <p className="consent-attention__empty">
            The consent records could not be read, so this list is not complete.
            Reload to try again.
          </p>
        ) : (
          <ConsentAttentionList
            rows={attention}
            describeRow={(row) =>
              describeConsentRecord(row.record) ?? getConsentStatusCopy(row.status)
            }
            audienceLabel={audienceLabel}
          />
        )}
      </div>
    </div>
  );
};

export default SchoolReadinessDashboard;
