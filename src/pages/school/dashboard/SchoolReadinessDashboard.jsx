import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import {
  CONSENT_STATUS,
  DEFAULT_ENFORCEMENT,
  deriveAgeCategory,
  getConsentStatus,
} from "../compliance/consentModel";
import { getStagedConsent } from "../compliance/stagedConsentStore";
import { getStagedDob } from "../compliance/stagedProfileStore";

/**
 * School compliance-readiness dashboard — the sales-demo opener.
 *
 * Reuses the members / outstanding-leases / overdue queries (same query keys as
 * MembersStatsRow, so counts stay in sync) and overlays the staged, client-side
 * DOB + guardian-consent state to produce a compliance-at-a-glance board:
 * headline KPIs, a consent-status breakdown, and a "needs attention" list of
 * students who can't be assigned a device until consent is recorded.
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

const STATUS_META = {
  [CONSENT_STATUS.NO_GUARDIAN]: {
    text: "No guardian on file",
    style: chip("var(--error-50, #fef3f2)", "var(--error-700, #b42318)"),
  },
  [CONSENT_STATUS.GUARDIAN_NO_CONSENT]: {
    text: "Consent missing",
    style: chip("var(--error-50, #fef3f2)", "var(--error-700, #b42318)"),
  },
  [CONSENT_STATUS.CONSENT_OUTDATED]: {
    text: "Consent out of date",
    style: chip("var(--warning-50, #fffaeb)", "var(--warning-700, #b54708)"),
  },
  [CONSENT_STATUS.CONSENT_VALID]: {
    text: "Consent valid",
    style: chip("var(--success-50, #ecfdf3)", "var(--success-700, #067647)"),
  },
  [CONSENT_STATUS.NOT_REQUIRED]: {
    text: "Not required",
    style: chip("var(--gray-100, #f2f4f7)", "var(--gray-600, #475467)"),
  },
};

const SchoolReadinessDashboard = ({ audienceLabel = "students" }) => {
  const { user } = useSelector((state) => state.admin);
  const companyId = user?.sqlInfo?.company_id;
  const enforcement = DEFAULT_ENFORCEMENT;

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

  const membersData = membersQuery?.data?.data?.members;
  const devicesOut = outstandingQuery?.data?.data?.rows?.length ?? 0;
  const overdue = overdueQuery?.data?.data?.count ?? 0;

  const { kpis, attention } = useMemo(() => {
    const members = membersData || [];
    const rows = members.map((m) => {
      const memberId = m.member_id ?? m.id;
      const dob = getStagedDob(memberId) ?? m.date_of_birth ?? null;
      const effective = { ...m, date_of_birth: dob };
      const consentRecord = getStagedConsent(memberId);
      const age = deriveAgeCategory(effective);
      const status = getConsentStatus(effective, consentRecord, enforcement);
      return { member: m, memberId, age, status };
    });

    const under13 = rows.filter((r) => r.age.isUnder13);
    const requiring = rows.filter((r) => r.age.isMinor || r.age.isUnder13);
    const valid = requiring.filter((r) => r.status === CONSENT_STATUS.CONSENT_VALID);
    const outdated = requiring.filter(
      (r) => r.status === CONSENT_STATUS.CONSENT_OUTDATED
    );
    const pending = requiring.filter(
      (r) =>
        r.status === CONSENT_STATUS.GUARDIAN_NO_CONSENT ||
        r.status === CONSENT_STATUS.NO_GUARDIAN
    );
    const coverage = requiring.length
      ? Math.round((valid.length / requiring.length) * 100)
      : 100;

    // Needs-attention: everyone who requires consent but isn't valid,
    // under-13 first, then by name.
    const attentionRows = requiring
      .filter((r) => r.status !== CONSENT_STATUS.CONSENT_VALID)
      .sort((a, b) => {
        if (a.age.isUnder13 !== b.age.isUnder13) return a.age.isUnder13 ? -1 : 1;
        return `${a.member.first_name} ${a.member.last_name}`.localeCompare(
          `${b.member.first_name} ${b.member.last_name}`
        );
      });

    return {
      kpis: {
        total: members.length,
        under13: under13.length,
        requiring: requiring.length,
        valid: valid.length,
        pending: pending.length,
        outdated: outdated.length,
        coverage,
      },
      attention: attentionRows,
    };
  }, [membersData, enforcement]);

  const coverageColor =
    kpis.coverage >= 100
      ? "var(--success-600, #079455)"
      : kpis.coverage >= 60
      ? "var(--warning-600, #dc6803)"
      : "var(--error-600, #d92d20)";

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
        <span style={chip("var(--blue-50, #eff8ff)", "var(--blue-700, #175cd3)")}>
          Consent policy v{enforcement.required_consent_policy_version} · enforcement
          on
        </span>
      </div>

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
          <p style={{ ...value, color: coverageColor }}>{kpis.coverage}%</p>
          <p style={caption}>
            {kpis.valid}/{kpis.requiring} requiring consent are valid
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
          }}
        >
          <Icon
            icon="tabler:alert-triangle"
            width={18}
            color={
              attention.length ? "var(--warning-600, #dc6803)" : "var(--success-600, #079455)"
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
            {attention.length
              ? `${attention.length} ${audienceLabel} cannot be assigned a device yet`
              : "every student requiring consent is cleared"}
          </span>
        </div>

        {attention.length === 0 ? (
          <div style={{ ...caption, padding: "20px", margin: 0 }}>
            No outstanding consent actions. 🎉
          </div>
        ) : (
          <div>
            {attention.map((r) => {
              const meta = STATUS_META[r.status] ?? STATUS_META[CONSENT_STATUS.GUARDIAN_NO_CONSENT];
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
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
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
                    {r.age.ageYears != null && (
                      <span style={caption}>
                        {r.age.isUnder13
                          ? `age ${r.age.ageYears} · under 13`
                          : `age ${r.age.ageYears} · minor`}
                      </span>
                    )}
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
