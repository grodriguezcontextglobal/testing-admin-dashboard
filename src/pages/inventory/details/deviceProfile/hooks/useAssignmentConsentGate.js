import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { getIndustryProfile } from "../../../../../config/industryProfiles";
import { fetchSchoolSettings } from "../../../../Profile/school_compliance/utils/schoolComplianceUtils";
import {
  getConsentStatusMessage,
  hasValidConsent,
  isConsentRequired,
} from "../../../../conditionalPage/utils/consentCheckUtils";
import { fetchStudentConsent } from "../../../../conditionalPage/utils/guardianConsentApi";
import {
  getConsentStatusCopy,
  isAssignmentBlockedByConsent,
  normalizeConsentStatus,
  resolveConsentEnforcement,
} from "../../../../conditionalPage/utils/guardianConsentUtils";

/**
 * The pre-assignment gate, shared by whichever surface starts the assignment.
 *
 * The member profile already enforced this; assigning from the device page has
 * to reach the same verdict from the same inputs, or the device page becomes
 * the way around the policy. The branching below therefore mirrors
 * AssignmentDevicesToMember rather than inventing a second interpretation:
 * live consent status when the endpoint answered, the legacy field check when
 * it didn't.
 */
export function useAssignmentConsentGate(member) {
  const { user } = useSelector((state) => state.admin);
  const companyId = user?.sqlInfo?.company_id;
  const isEducation = user?.companyData?.industry === "Education";
  const memberId = member?.member_id ?? null;

  const settingsQuery = useQuery({
    queryKey: ["schoolSettings", companyId],
    queryFn: () => fetchSchoolSettings(companyId),
    enabled: isEducation && Boolean(companyId),
    staleTime: 5 * 60 * 1000,
  });

  const schoolSettings = settingsQuery.data?.settings || {};
  const enforcing = resolveConsentEnforcement(schoolSettings);
  // Scoped to Education for the same reason the member flow scopes it: the AUP
  // consent regime is a school rule, and a non-school company keeps its old
  // behaviour rather than being newly blocked.
  const memberIsMinor = isEducation && Number(member?.minor) === 1;

  // A minor's status is fetched whether or not the company enforces consent:
  // the server's refusal does not consult the company setting, so neither can
  // this gate. `enforcing` also read a key the settings endpoint never returns
  // (`enforce_member_consent`), which meant this query was effectively disabled.
  const consentQuery = useQuery({
    queryKey: ["studentConsentStatus", memberId, companyId],
    queryFn: () => fetchStudentConsent(companyId, memberId),
    enabled:
      Boolean(memberId) && isEducation && (memberIsMinor || enforcing),
    staleTime: 60 * 1000,
  });

  if (!member) {
    return {
      ready: true,
      blocking: false,
      tone: "neutral",
      title: null,
      message: null,
      fixHref: null,
    };
  }

  const repLabel = getIndustryProfile(
    user?.companyData?.industry
  ).representative.label.toLowerCase();

  const isMinor = Number(member.minor) === 1;
  const guardianComplete = Boolean(
    member.parent_guardian_first_name?.trim?.() &&
      member.parent_guardian_email?.trim?.()
  );
  const guardianIncomplete = isMinor && !guardianComplete;
  const fixHref = `/member/${member.member_id}/update-member-information`;

  // A minor with no responsible adult on file blocks before consent is even
  // considered — there is nobody to hold responsible for the device.
  if (guardianIncomplete) {
    return {
      ready: true,
      blocking: true,
      tone: "critical",
      title: "Representative required",
      message: `${member.first_name ?? "This member"} is a minor with no complete ${repLabel} on file. Add a name and email before assigning a device.`,
      fixHref,
    };
  }

  const consentStatus = normalizeConsentStatus(
    consentQuery.data,
    schoolSettings.required_consent_policy_version
  );

  // Mirrors the server's floor: a minor without agreed consent is never
  // assignable, whatever the company set. This branch used to defer entirely to
  // the company policy, so a school with enforcement off got a green gate here
  // and a CONSENT_REQUIRED from the lease endpoint one warehouse write later.
  const blocking = consentQuery.isSuccess
    ? isAssignmentBlockedByConsent({
        consentStatus,
        settings: schoolSettings,
        isMinor: memberIsMinor,
      })
    : (memberIsMinor && !hasValidConsent(member.consent)) ||
      isConsentRequired({
        isMinor,
        isUnder13: Boolean(member.under_13),
        enforceMemberConsent: resolveConsentEnforcement(schoolSettings),
        enforceUnder13: Boolean(schoolSettings.enforce_under_13),
        consentExists: hasValidConsent(member.consent),
      });

  if (blocking) {
    return {
      ready: !consentQuery.isLoading,
      blocking: true,
      tone: consentStatus === "refused" ? "critical" : "warning",
      title: `Consent ${consentStatus}`,
      message: consentQuery.isSuccess
        ? getConsentStatusCopy(consentStatus)
        : getConsentStatusMessage({
            isMinor,
            isUnder13: Boolean(member.under_13),
            consentRequired: true,
            consentExists: false,
          }),
      fixHref,
    };
  }

  if (isMinor) {
    return {
      ready: true,
      blocking: false,
      tone: "success",
      title: "Represented by an adult",
      message: `${member.parent_guardian_first_name ?? ""} ${
        member.parent_guardian_last_name ?? ""
      }`.trim()
        ? `${member.parent_guardian_first_name} ${member.parent_guardian_last_name} (${member.parent_guardian_email}) signs for this device.`
        : "A representative is on file for this member.",
      fixHref: null,
    };
  }

  return {
    ready: true,
    blocking: false,
    tone: "neutral",
    title: null,
    message: `${member.first_name ?? "This member"} signs their own liability contract.`,
    fixHref: null,
  };
}

export default useAssignmentConsentGate;
