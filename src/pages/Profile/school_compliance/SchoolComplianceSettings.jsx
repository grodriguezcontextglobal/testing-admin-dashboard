import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Switch, message } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import SectionHeader from "../../../components/documents/new_form_components/SectionHeader";
import SelectComponent from "../../../components/UX/dropdown/SelectComponent";
import { usePermission } from "../../../hooks/usePermission";
import { useStatusNotification } from "../../../components/notification/alerts/useStatusNotification";
import { isDocumentExpired } from "../Documents/utils/documentExpirationUtils";
import { useSchoolSettings } from "./utils/useSchoolSettings";
import {
  buildConsentEnforcementPayload,
  fetchSchoolConsentDocuments,
  hasSettingsChanges,
  updateConsentEnforcement,
} from "./utils/schoolComplianceUtils";

const SchoolComplianceSettings = () => {
  const { user } = useSelector((state) => state.admin);
  const companyIdForDocument = user?.companyData?.id ?? null;
  const companyId = user?.sqlInfo?.company_id ?? null;
  const { settings, isLoading, isEducation } = useSchoolSettings();
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useStatusNotification();

  // usePermission, not `user?.roleType`: the raw field is undefined on legacy
  // accounts, which left this form permanently read-only for them.
  const canEdit = usePermission("member:update");

  // Form state — initialized from server settings
  const [enforce, setEnforce] = useState(false);
  const [enforceUnder13, setEnforceUnder13] = useState(false);
  const [policyVersion, setPolicyVersion] = useState("1");
  const [consentDocumentId, setConsentDocumentId] = useState(null);

  // Track original values for dirty checking
  const [originalValues, setOriginalValues] = useState(null);

  const consentDocumentsQuery = useQuery({
    queryKey: ["schoolConsentDocuments", companyIdForDocument],
    queryFn: () => fetchSchoolConsentDocuments(companyIdForDocument),
    enabled: !!companyIdForDocument,
  });
  const consentDocuments = consentDocumentsQuery.data ?? [];
  const consentDocumentOptions = consentDocuments.map((doc) => {
    const expired = isDocumentExpired(doc.expiration_date);
    return {
      id: doc._id,
      label: doc.title,
      disabled: expired,
      supportingText: expired ? "Expired" : undefined,
    };
  });
  const selectedConsentDocumentOption =
    consentDocumentOptions.find((option) => option.id === consentDocumentId) ??
    null;

  useEffect(() => {
    if (settings) {
      const initialValues = {
        enforce: Boolean(settings.enforce_member_consent),
        // Read key is enforce_under_13_consent — confirmed against the real
        // backend response (2026-08-04); the write payload's key stays
        // enforce_under_13 (also confirmed, the two are asymmetric).
        enforceUnder13: Boolean(settings.enforce_under_13_consent),
        policyVersion: settings.required_consent_policy_version || "1",
        consentDocumentId: settings.consent_document_id || null,
      };
      setEnforce(initialValues.enforce);
      setEnforceUnder13(initialValues.enforceUnder13);
      setPolicyVersion(initialValues.policyVersion);
      setConsentDocumentId(initialValues.consentDocumentId);
      setOriginalValues(initialValues);
    }
  }, [settings]);

  const currentValues = { enforce, enforceUnder13, policyVersion, consentDocumentId };
  const isDirty = hasSettingsChanges(currentValues, originalValues);

  const mutation = useMutation({
    mutationFn: (payload) => updateConsentEnforcement(companyId, payload),
    onSuccess: (result) => {
      if (result.ok) {
        notify("success", "School compliance settings updated", 3);
        queryClient.invalidateQueries({ queryKey: ["schoolSettings", companyId] });
      }
    },
    onError: (error) => {
      message.error(
        error?.response?.data?.msg ||
          "Failed to update school compliance settings. Please try again."
      );
    },
  });

  const handleSave = () => {
    if (!isDirty) return;
    const payload = buildConsentEnforcementPayload(companyId, currentValues);
    mutation.mutate(payload);
  };

  // Don't render for non-Education companies
  if (!isEducation) return null;

  if (isLoading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>Loading...</div>
    );
  }

  const enforceWarning =
    originalValues?.enforce && !enforce
      ? "Disabling consent enforcement may allow device assignment before guardian consent is recorded."
      : null;

  return (
    <>
      {contextHolder}
      <div style={{ width: "100%", padding: 0 }}>
        <SectionHeader
          title="School Compliance Settings"
          subtitle="Configure FERPA/COPPA consent enforcement for your education company. These settings control whether guardian consent is required before device assignment."
          loading={mutation.isLoading}
          saveButton={canEdit ? handleSave : undefined}
        />
        <div
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Require guardian consent for minors */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px",
              border: "1px solid var(--gray-200, #ddded6)",
              borderRadius: "8px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--gray-700, #484d47)",
                }}
              >
                Require guardian consent for minors
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--gray-500, #777b73)",
                  marginTop: "4px",
                }}
              >
                When enabled, device assignment to minors requires recorded
                guardian consent (AUP).
              </div>
            </div>
            <Switch
              checked={enforce}
              onChange={setEnforce}
              disabled={!canEdit}
            />
          </div>

          {/* Require COPPA consent for under-13 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px",
              border: "1px solid var(--gray-200, #ddded6)",
              borderRadius: "8px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--gray-700, #484d47)",
                }}
              >
                Require COPPA consent for under-13 students
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--gray-500, #777b73)",
                  marginTop: "4px",
                }}
              >
                Additional consent requirement for students under 13 years old,
                per COPPA regulations.
              </div>
            </div>
            <Switch
              checked={enforceUnder13}
              onChange={setEnforceUnder13}
              disabled={!canEdit}
            />
          </div>

          {/* Required consent policy version */}
          {/* <div
            style={{
              padding: "16px",
              border: "1px solid var(--gray-200, #ddded6)",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--gray-700, #484d47)",
                marginBottom: "8px",
              }}
            >
              Required consent policy version
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--gray-500, #777b73)",
                marginBottom: "12px",
              }}
            >
              The policy version that must be signed. Leave empty for no version
              requirement.
            </div>
            <input
              type="text"
              value={policyVersion}
              onChange={(e) => setPolicyVersion(e.target.value)}
              disabled={!canEdit}
              style={{
                width: "100%",
                maxWidth: "200px",
                padding: "8px 12px",
                border: "1px solid var(--gray-300, #c4c7c0)",
                borderRadius: "6px",
                fontSize: "14px",
              }}
              placeholder="e.g. 1"
            />
          </div> */}

          {/* School consent document assignment */}
          <div
            style={{
              padding: "16px",
              border: "1px solid var(--gray-200, #ddded6)",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--gray-700, #484d47)",
                marginBottom: "8px",
              }}
            >
              School consent document
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--gray-500, #777b73)",
                marginBottom: "12px",
              }}
            >
              The document guardians will see and sign on the public consent
              page. Upload it from Documents tagged &quot;School Consent&quot; first.
            </div>
            <SelectComponent
              placeholder="Select a document"
              items={consentDocumentOptions}
              value={selectedConsentDocumentOption}
              onSelect={(item) => setConsentDocumentId(item?.id ?? null)}
              isRequired={enforce}
            />
            {!consentDocumentsQuery.isLoading &&
              consentDocumentOptions.length === 0 && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--gray-500, #777b73)",
                    marginTop: "8px",
                  }}
                >
                  No documents tagged &quot;School Consent&quot; yet. Upload one
                  from Documents first.
                </div>
              )}
          </div>

          {/* Warning when disabling enforcement */}
          {enforceWarning && (
            <div
              style={{
                padding: "12px 16px",
                background: "#fff7e6",
                border: "1px solid #ffd591",
                borderRadius: "8px",
                color: "#ad6800",
                fontSize: "13px",
              }}
            >
              {enforceWarning}
            </div>
          )}

          {!canEdit && (
            <div
              style={{
                padding: "12px 16px",
                background: "var(--gray-50, #f7f7f4)",
                border: "1px solid var(--gray-200, #ddded6)",
                borderRadius: "8px",
                color: "var(--gray-500, #777b73)",
                fontSize: "13px",
              }}
            >
              You do not have permission to edit school compliance settings.
              Contact an administrator.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SchoolComplianceSettings;
