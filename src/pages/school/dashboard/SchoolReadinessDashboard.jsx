import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { Button, Modal, message } from "antd";
import { devitrakApi } from "../../../api/devitrakApi";
import { fetchSchoolSettings } from "../../Profile/school_compliance/utils/schoolComplianceUtils";
import { fetchStudentConsent } from "../../conditionalPage/utils/guardianConsentApi";
import {
  getConsentStatusCopy,
  normalizeConsentStatus,
} from "../../conditionalPage/utils/guardianConsentUtils";
import { calculateStudentAgeFlags } from "../../conditionalPage/utils/ageCalculationUtils";
import { loadDemoData } from "../compliance/loadDemoData";

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

/** Consent status → chip label + style. Mirrors guardianConsentUtils statuses. */
const STATUS_CHIP = {
  missing: { text: "Consent not requested", style: ERROR_CHIP },
  refused: { text: "Guardian refused", style: ERROR_CHIP },
  expired: { text: "Consent link expired", style: WARN_CHIP },
  stale: { text: "New policy — reconsent", style: WARN_CHIP },
  pending: { text: "Awaiting guardian", style: WARN_CHIP },
  agreed: { text: "Consent agreed", style: OK_CHIP },
};

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
  const enforcementOn = Boolean(settings.enforce || settings.enforce_under_13);
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

  // One consent read per student who needs it — cached per member by react-query.
  const consentQueries = useQueries({
    queries: consentTargets.map((r) => ({
      queryKey: ["studentConsentStatus", r.memberId, companyId],
      queryFn: () => fetchStudentConsent(companyId, r.memberId),
      enabled: !!companyId && !!r.memberId && isEducation,
      staleTime: 60 * 1000,
    })),
  });

  const consentLoading = consentQueries.some((q) => q.isLoading);

  const { kpis, attention } = useMemo(() => {
    const rows = consentTargets.map((r, i) => ({
      ...r,
      status: normalizeConsentStatus(consentQueries[i]?.data),
    }));

    const under13 = roster.filter((r) => r.flags.under_13);
    const agreed = rows.filter((r) => r.status === "agreed");
    const outstanding = rows.filter((r) => r.status !== "agreed");
    const coverage = rows.length
      ? Math.round((agreed.length / rows.length) * 100)
      : 100;

    // under-13 first (COPPA), then by name
    const attentionRows = [...outstanding].sort((a, b) => {
      if (a.flags.under_13 !== b.flags.under_13) return a.flags.under_13 ? -1 : 1;
      return `${a.member.first_name} ${a.member.last_name}`.localeCompare(
        `${b.member.first_name} ${b.member.last_name}`
      );
    });

    return {
      kpis: {
        total: roster.length,
        under13: under13.length,
        requiring: rows.length,
        agreed: agreed.length,
        coverage,
      },
      attention: attentionRows,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- consentQueries is a new array each render; its data is keyed by consentTargets
  }, [roster, consentTargets, JSON.stringify(consentQueries.map((q) => q.data ?? null))]);

  const coverageColor =
    kpis.coverage >= 100
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
          <span
            style={
              enforcementOn
                ? chip("var(--blue-50, #eff8ff)", "var(--blue-700, #175cd3)")
                : NEUTRAL_CHIP
            }
          >
            {enforcementOn
              ? `Consent enforcement on${
                  requiredPolicyVersion ? ` · policy v${requiredPolicyVersion}` : ""
                }`
              : "Consent enforcement off"}
          </span>
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
            <Icon icon="tabler:writing-sign" width={16} /> Consent coverage
          </p>
          <p style={{ ...value, color: coverageColor }}>
            {consentLoading ? "…" : `${kpis.coverage}%`}
          </p>
          <p style={caption}>
            {enforcementOn
              ? `${kpis.agreed}/${kpis.requiring} requiring consent have agreed`
              : "enforcement is off"}
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
            {consentLoading
              ? "checking consent records…"
              : attention.length
              ? `${attention.length} ${audienceLabel} cannot be assigned a device yet`
              : enforcementOn
              ? "every student requiring consent has agreed"
              : "consent enforcement is off"}
          </span>
        </div>

        {attention.length === 0 ? (
          <div style={{ ...caption, padding: "20px", margin: 0 }}>
            {consentLoading ? "Loading…" : "No outstanding consent actions. 🎉"}
          </div>
        ) : (
          <div>
            {attention.map((r) => {
              const meta = STATUS_CHIP[r.status] ?? STATUS_CHIP.missing;
              return (
                <div
                  key={r.memberId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "12px 20px",
                    borderTop: "1px solid var(--gray-100, #f2f4f7)",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      minWidth: 0,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--gray-900, #171d1a)",
                      }}
                    >
                      {r.member.first_name} {r.member.last_name}
                    </span>
                    {r.flags.dob_valid && (
                      <span style={caption}>
                        {r.flags.under_13
                          ? `age ${r.flags.age} · under 13`
                          : `age ${r.flags.age} · minor`}
                      </span>
                    )}
                    <span style={caption}>{getConsentStatusCopy(r.status)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={meta.style}>{meta.text}</span>
                    <Link
                      to={`/member/${r.memberId}/main`}
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--blue-700, #175cd3)",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Review →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolReadinessDashboard;
