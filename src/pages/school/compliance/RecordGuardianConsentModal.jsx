import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Input, Modal, Select, message } from "antd";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import { Subtitle } from "../../../styles/global/Subtitle";
import {
  DEFAULT_CONSENT_METHOD,
  DEFAULT_POLICY_TYPE,
  DEFAULT_POLICY_VERSION,
} from "./consentModel";

const POLICY_TYPES = [
  { value: "AUP", label: "Acceptable Use Policy (AUP)" },
  { value: "FERPA", label: "FERPA data-sharing" },
  { value: "PHOTO", label: "Photo / media release" },
];

const METHODS = [
  { value: "e-signature", label: "E-signature" },
  { value: "paper", label: "Signed paper form" },
  { value: "verbal", label: "Verbal (staff-attested)" },
];

const labelStyle = { ...Subtitle, textAlign: "left", margin: "0 0 4px" };
const fieldWrap = { width: "100%", margin: "0 0 16px" };

/**
 * Record-guardian-consent modal. Collects signer + policy details and hands the
 * record up via `onRecord` (the parent owns the staged store / hook). The field
 * shape matches POST /api/school/consent/record for a later real-backend swap.
 */
const RecordGuardianConsentModal = ({
  open,
  onClose,
  member,
  requiredPolicyVersion = DEFAULT_POLICY_VERSION,
  onRecord,
}) => {
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [policyType, setPolicyType] = useState(DEFAULT_POLICY_TYPE);
  const [policyVersion, setPolicyVersion] = useState(requiredPolicyVersion);
  const [method, setMethod] = useState(DEFAULT_CONSENT_METHOD);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill the signer from the guardian on file each time the modal opens.
  useEffect(() => {
    if (!open) return;
    const guardianName = [
      member?.parent_guardian_first_name,
      member?.parent_guardian_last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    setSignerName(guardianName);
    setSignerEmail(member?.parent_guardian_email ?? "");
    setPolicyType(DEFAULT_POLICY_TYPE);
    setPolicyVersion(requiredPolicyVersion);
    setMethod(DEFAULT_CONSENT_METHOD);
  }, [open, member, requiredPolicyVersion]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signerEmail.trim());
  const canSubmit = signerName.trim().length > 0 && emailValid && !submitting;

  const studentName =
    [member?.first_name, member?.last_name].filter(Boolean).join(" ").trim() ||
    "this student";

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      onRecord?.({
        signer_name: signerName.trim(),
        signer_email: signerEmail.trim(),
        policy_type: policyType,
        policy_version: String(policyVersion),
        method,
      });
      message.success("Guardian consent recorded.");
      onClose?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title="Record guardian consent"
      destroyOnClose
    >
      <p
        style={{
          ...Subtitle,
          textAlign: "left",
          textTransform: "none",
          margin: "0 0 20px",
          color: "var(--gray-600, #5d615a)",
        }}
      >
        Recording a guardian&apos;s consent for <strong>{studentName}</strong>{" "}
        allows a device to be assigned. This is separate from simply having a
        guardian on file — consent must be explicitly granted.
      </p>

      <div style={fieldWrap}>
        <p style={labelStyle}>Signer name</p>
        <Input
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
          placeholder="Parent or guardian full name"
          size="large"
        />
      </div>

      <div style={fieldWrap}>
        <p style={labelStyle}>Signer email</p>
        <Input
          value={signerEmail}
          onChange={(e) => setSignerEmail(e.target.value)}
          placeholder="guardian@email.com"
          status={signerEmail.length > 0 && !emailValid ? "error" : ""}
          size="large"
        />
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <div style={{ ...fieldWrap, width: "60%" }}>
          <p style={labelStyle}>Policy type</p>
          <Select
            value={policyType}
            onChange={setPolicyType}
            options={POLICY_TYPES}
            style={{ width: "100%" }}
            size="large"
          />
        </div>
        <div style={{ ...fieldWrap, width: "40%" }}>
          <p style={labelStyle}>Policy version</p>
          <Input
            value={policyVersion}
            onChange={(e) => setPolicyVersion(e.target.value)}
            placeholder="e.g. 1"
            size="large"
          />
        </div>
      </div>

      <div style={fieldWrap}>
        <p style={labelStyle}>Consent method</p>
        <Select
          value={method}
          onChange={setMethod}
          options={METHODS}
          style={{ width: "100%" }}
          size="large"
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
          marginTop: "8px",
        }}
      >
        <GrayButtonComponent title="Cancel" func={onClose} />
        <BlueButtonComponent
          title="Record consent"
          func={handleSubmit}
          disabled={!canSubmit}
          loadingState={submitting}
        />
      </div>
    </Modal>
  );
};

RecordGuardianConsentModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  member: PropTypes.object,
  requiredPolicyVersion: PropTypes.string,
  onRecord: PropTypes.func,
};

export default RecordGuardianConsentModal;
