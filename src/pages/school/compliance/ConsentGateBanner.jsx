import PropTypes from "prop-types";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import { BLOCK_REASON, CONSENT_STATUS, DEFAULT_POLICY_VERSION } from "./consentModel";

const base = {
  width: "100%",
  textAlign: "left",
  borderRadius: "var(--radius-md, 8px)",
  padding: "12px 16px",
  margin: "0 0 16px",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  lineHeight: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
};

const tone = {
  error: {
    background: "var(--error-25, #fdf7f5)",
    border: "1px solid var(--error-300, #e28f75)",
    color: "var(--error-700, #9a3922)",
  },
  warning: {
    background: "var(--warning-25, #fffcf5)",
    border: "1px solid var(--warning-300, #f7b27a)",
    color: "var(--warning-700, #b54708)",
  },
  success: {
    background: "var(--success-25, #f6fef9)",
    border: "1px solid var(--success-300, #75e0a7)",
    color: "var(--success-700, #067647)",
  },
};

const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

/**
 * Consent-focused banner for the device-assignment flow. Complements the
 * existing representative/minor banner by surfacing GUARDIAN CONSENT state
 * specifically, and — when assignment is blocked — offering the record-consent
 * action inline. Renders nothing for adults / when consent is not required.
 */
const ConsentGateBanner = ({
  status,
  reason,
  requiredPolicyVersion = DEFAULT_POLICY_VERSION,
  consentRecord,
  studentFirstName = "This student",
  onRecordConsent,
  onManageGuardian,
}) => {
  if (!status || status === CONSENT_STATUS.NOT_REQUIRED) return null;

  const recordCta = onRecordConsent ? (
    <BlueButtonComponent title="Record guardian consent" func={onRecordConsent} />
  ) : null;

  if (status === CONSENT_STATUS.CONSENT_VALID) {
    return (
      <div style={{ ...base, ...tone.success }}>
        <span>
          <strong>Guardian consent on file.</strong> {consentRecord?.policy_type}{" "}
          v{consentRecord?.policy_version} — signed by {consentRecord?.signer_name}
          {consentRecord?.recorded_at ? ` on ${fmtDate(consentRecord.recorded_at)}` : ""} (
          {consentRecord?.method}). Device assignment is permitted.
        </span>
      </div>
    );
  }

  if (status === CONSENT_STATUS.NO_GUARDIAN) {
    return (
      <div style={{ ...base, ...tone.error }}>
        <span>
          <strong>Guardian required.</strong> {studentFirstName} needs a guardian
          on file before consent can be recorded and a device assigned.
        </span>
        {onManageGuardian ? (
          <BlueButtonComponent title="Add guardian" func={onManageGuardian} />
        ) : null}
      </div>
    );
  }

  if (status === CONSENT_STATUS.CONSENT_OUTDATED) {
    return (
      <div style={{ ...base, ...tone.warning }}>
        <span>
          <strong>Consent out of date.</strong> The consent on file is for policy
          v{consentRecord?.policy_version}, but v{requiredPolicyVersion} is now
          required. Re-record guardian consent before assigning a device.
        </span>
        {recordCta}
      </div>
    );
  }

  // GUARDIAN_NO_CONSENT — the blocked case.
  const under13 = reason === BLOCK_REASON.UNDER_13_CONSENT_REQUIRED;
  return (
    <div style={{ ...base, ...tone.error }}>
      <span>
        <strong>
          {under13
            ? "Guardian consent required (student under 13)."
            : "Guardian consent required."}
        </strong>{" "}
        A valid guardian consent record is required before a device can be
        assigned to {studentFirstName}
        {under13 ? " under COPPA" : ""}. A guardian is on file, but consent has
        not been recorded yet.
      </span>
      {recordCta}
    </div>
  );
};

ConsentGateBanner.propTypes = {
  status: PropTypes.string,
  reason: PropTypes.string,
  requiredPolicyVersion: PropTypes.string,
  consentRecord: PropTypes.object,
  studentFirstName: PropTypes.string,
  onRecordConsent: PropTypes.func,
  onManageGuardian: PropTypes.func,
};

export default ConsentGateBanner;
