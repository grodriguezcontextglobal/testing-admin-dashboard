import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Badge, Divider, Spin, Tag } from "antd";
import { useSelector } from "react-redux";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import {
  fetchStudentConsent,
  sendConsentRequest,
  resendConsentRequest,
} from "../../../utils/guardianConsentApi";
import {
  getConsentStatusCopy,
  isConsentAgreed,
  normalizeConsentStatus,
} from "../../../utils/guardianConsentUtils";
import {
  fetchSchoolConsentDocuments,
  fetchSchoolSettings,
} from "../../../../Profile/school_compliance/utils/schoolComplianceUtils";
import { isDocumentExpired } from "../../../../Profile/Documents/utils/documentExpirationUtils";
import { useStatusNotification } from "../../../../../components/notification/alerts/useStatusNotification";

const tagColorByStatus = {
  missing: "default",
  pending: "processing",
  agreed: "success",
  refused: "error",
  expired: "warning",
  stale: "warning",
};

const alertByStatus = {
  missing: {
    type: "info",
    message: "Consent has not been requested yet.",
  },
  pending: {
    type: "info",
    message: "Waiting for guardian response.",
  },
  refused: {
    type: "error",
    message: "Guardian refused consent.",
  },
  expired: {
    type: "warning",
    message: "Consent link expired.",
  },
  stale: {
    type: "warning",
    message: "A new policy version requires consent again.",
  },
};

function capitalizeStatus(status) {
  if (!status) return "Missing";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// The real POST /school/consent response (confirmed 2026-08-04) is
// `{ consents: [...] }` — plural, an array — not `.consent`/`.record`. Pick
// the most recently requested record when there's more than one (e.g. a
// stale request left behind after a policy version bump).
function resolveConsentRecord(response) {
  if (!response || typeof response !== "object") return null;
  if (Array.isArray(response.consents) && response.consents.length > 0) {
    return [...response.consents].sort(
      (a, b) => new Date(b.requested_at || 0) - new Date(a.requested_at || 0)
    )[0];
  }
  return response.consent || response.record || response.data?.consent || null;
}

export const StudentConsentPanel = ({
  memberId,
  memberData,
  policyType = "AUP",
  requiredPolicyVersion = null,
}) => {
  const { user } = useSelector((state) => state.admin);
  const queryClient = useQueryClient();
  const companyId = user?.sqlInfo?.company_id;
  // /document/* is keyed by the Mongo company id, unlike /school/settings*
  // and the consent-request endpoints, which use the SQL company_id. Matches
  // the `companyData.id` convention already used by Documents.jsx.
  const mongoCompanyId = user?.companyData?.id ?? null;
  const { notify, contextHolder } = useStatusNotification();

  const consentQuery = useQuery({
    queryKey: ["studentConsent", memberId],
    queryFn: () => fetchStudentConsent(companyId, memberId),
    enabled: !!memberId && !!companyId,
  });

  const settingsQuery = useQuery({
    queryKey: ["schoolSettings"],
    queryFn: () => fetchSchoolSettings(companyId),
    enabled: !!companyId,
  });

  const settingsPolicyVersion =
    settingsQuery.data?.settings?.required_consent_policy_version ??
    settingsQuery.data?.data?.settings?.required_consent_policy_version ??
    null;
  const effectivePolicyVersion = requiredPolicyVersion ?? settingsPolicyVersion;
  const consentDocumentId =
    settingsQuery.data?.settings?.consent_document_id ??
    settingsQuery.data?.data?.settings?.consent_document_id ??
    null;

  const consentDocumentsQuery = useQuery({
    queryKey: ["schoolConsentDocuments", mongoCompanyId],
    queryFn: () => fetchSchoolConsentDocuments(mongoCompanyId),
    enabled: !!mongoCompanyId,
  });
  const assignedConsentDocument = (consentDocumentsQuery.data ?? []).find(
    (doc) => doc._id === consentDocumentId
  );
  const isAssignedDocumentExpired = isDocumentExpired(
    assignedConsentDocument?.expiration_date
  );
  const consentResponse = consentQuery.data?.data ?? consentQuery.data;
  const consentRecord = resolveConsentRecord(consentResponse);
  const consentStatus = normalizeConsentStatus(
    consentRecord
      ? {
          ...consentResponse,
          required_consent_policy_version: effectivePolicyVersion,
        }
      : consentResponse
  );
  const isAgreed =
    consentStatus === "agreed" ||
    isConsentAgreed(consentRecord, effectivePolicyVersion);
  const alert = alertByStatus[consentStatus];

  const guardianName = [
    memberData?.parent_guardian_first_name,
    memberData?.parent_guardian_last_name,
  ]
    .filter(Boolean)
    .join(" ");
  const guardianEmail = memberData?.parent_guardian_email;
  const guardianPhone = memberData?.parent_guardian_phone_number;
  // Document assignment (consent_document_id) isn't persisted by the backend
  // yet — confirmed 2026-08-04: /school/settings/consent-enforcement accepts
  // and echoes it but never stores it, so requiring it here would make
  // sending permanently impossible. The hints below stay informational only
  // until backend actually persists the assignment.
  const canSendRequest =
    Boolean(guardianEmail) && consentStatus !== "pending" && !isAgreed;
  const isResend = ["expired", "refused", "stale"].includes(consentStatus);
  const sendButtonLabel = isResend ? "Resend" : "Send Consent Request";

  const sendConsentMutation = useMutation({
    mutationFn: (payload) => sendConsentRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["studentConsent", memberId]);
      notify("success", "Consent request sent");
    },
    onError: (err) => {
      notify(
        "error",
        err?.response?.data?.msg || "Failed to send consent request",
      );
    },
  });

  const resendConsentMutation = useMutation({
    mutationFn: (payload) => resendConsentRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["studentConsent", memberId]);
      notify("success", "Consent request resent");
    },
    onError: (err) => {
      const status = err?.response?.status;
      if (status === 404) {
        notify("error", "No pending request to resend — send a new one first");
        return;
      }
      if (status === 409) {
        notify("warning", "Guardian already responded — nothing to resend");
        return;
      }
      if (status === 422) {
        notify("error", "No guardian email on file");
        return;
      }
      notify(
        "error",
        err?.response?.data?.msg || "Failed to resend consent request",
      );
    },
  });

  const handleSendConsentRequest = () => {
    if (isResend) {
      resendConsentMutation.mutate({
        company_id: companyId,
        member_id: memberId,
        policy_type: policyType,
        policy_version: effectivePolicyVersion || "1",
        document_id: consentDocumentId,
      });
      return;
    }
    sendConsentMutation.mutate({
      company_id: companyId,
      member_id: memberId,
      guardian_id: null,
      policy_type: policyType,
      policy_version: effectivePolicyVersion || "1",
      document_id: consentDocumentId,
    });
  };

  if (consentQuery.isLoading) {
    return (
      <div style={{ padding: "1rem", display: "grid", placeItems: "center" }}>
        <Spin aria-label="Loading consent status" />
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #eaecf0",
        borderRadius: 12,
        padding: "1rem",
        display: "grid",
        gap: "0.75rem",
        background: "#ffffff",
      }}
    >
      {contextHolder}
      <div>
        <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>
          Student Consent
        </h3>
      </div>

      <Divider style={{ margin: 0 }} />

      <div style={{ display: "grid", gap: "0.5rem" }}>
        <div>
          <strong>Status:</strong>{" "}
          <Badge status={tagColorByStatus[consentStatus]} />
          <Tag
            color={tagColorByStatus[consentStatus]}
            title={getConsentStatusCopy(consentStatus)}
          >
            {capitalizeStatus(consentStatus)}
          </Tag>
        </div>
        <div>
          <strong>Policy:</strong> {policyType} v{effectivePolicyVersion || "1"}
        </div>
      </div>

      {alert ? <Alert type={alert.type} message={alert.message} showIcon /> : null}

      <div style={{ display: "grid", gap: "0.35rem" }}>
        <div>
          <strong>Guardian:</strong> {guardianName || "Not provided"}
        </div>
        <div>
          <strong>Email:</strong> {guardianEmail || "Not provided"}
        </div>
        <div>
          <strong>Phone:</strong> {guardianPhone || "Not provided"}
        </div>
      </div>

      {!isAgreed ? (
        <>
          <Divider style={{ margin: 0 }} />
          <div>
            <BlueButtonComponent
              title={sendButtonLabel}
              iconLeading={<span aria-hidden="true" />}
              func={handleSendConsentRequest}
              loadingState={
                sendConsentMutation.isLoading || resendConsentMutation.isLoading
              }
              disabled={!canSendRequest}
            />
          </div>
          {!consentDocumentId ? (
            <Alert
              type="warning"
              showIcon
              message="Assign a School Consent document in Compliance Settings before sending requests."
            />
          ) : isAssignedDocumentExpired ? (
            <Alert
              type="warning"
              showIcon
              message="The assigned School Consent document has expired — update it in Compliance Settings before sending requests."
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
};
