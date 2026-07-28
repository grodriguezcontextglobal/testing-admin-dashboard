import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch, message, notification } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import SectionHeader from "../../../components/documents/new_form_components/SectionHeader";
import { hasPermission } from "../../../config/roles";
import { useSchoolSettings } from "./utils/useSchoolSettings";
import {
  buildConsentEnforcementPayload,
  hasSettingsChanges,
  updateConsentEnforcement,
} from "./utils/schoolComplianceUtils";

const SchoolComplianceSettings = () => {
  const { user } = useSelector((state) => state.admin);
  const companyId = user?.sqlInfo?.company_id;
  const { settings, isLoading, isEducation } = useSchoolSettings();
  const queryClient = useQueryClient();
  const [api, contextHolder] = notification.useNotification();

  const canEdit = hasPermission("member:update", user?.roleType);

  // Form state — initialized from server settings
  const [enforce, setEnforce] = useState(false);
  const [enforceUnder13, setEnforceUnder13] = useState(false);
  const [policyVersion, setPolicyVersion] = useState("1");

  // Track original values for dirty checking
  const [originalValues, setOriginalValues] = useState(null);

  useEffect(() => {
    if (settings) {
      const initialValues = {
        enforce: Boolean(settings.enforce_member_consent),
        enforceUnder13: Boolean(settings.enforce_under_13),
        policyVersion: settings.required_consent_policy_version || "1",
      };
      setEnforce(initialValues.enforce);
      setEnforceUnder13(initialValues.enforceUnder13);
      setPolicyVersion(initialValues.policyVersion);
      setOriginalValues(initialValues);
    }
  }, [settings]);

  const currentValues = { enforce, enforceUnder13, policyVersion };
  const isDirty = hasSettingsChanges(currentValues, originalValues);

  const mutation = useMutation({
    mutationFn: (payload) => updateConsentEnforcement(companyId, payload),
    onSuccess: (result) => {
      if (result.ok) {
        api.success({
          message: "School compliance settings updated",
          duration: 3,
        });
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
