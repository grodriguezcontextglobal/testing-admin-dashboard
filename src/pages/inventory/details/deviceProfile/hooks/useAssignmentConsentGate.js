import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { getIndustryProfile } from "../../../../../config/industryProfiles";
import { fetchSchoolSettings } from "../../../../Profile/school_compliance/utils/schoolComplianceUtils";
import {
  getConsentStatusMessage,
  hasValidConsent,
} from "../../../../conditionalPage/utils/consentCheckUtils";
import { fetchStudentConsent } from "../../../../conditionalPage/utils/guardianConsentApi";
import {
  getConsentStatusCopy,
  isAssignmentBlockedByConsent,
  isConsentRequiredForMember,
  normalizeConsentStatus,
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
  // Scoped to Education for the same reason the member flow scopes it: the
  // consent regime is a school rule.
  const memberIsMinor = isEducation && Number(member?.minor) === 1;
  const memberIsUnder13 = isEducation && Boolean(member?.under_13);
  // Each toggle is an age scope: with both off, no age is checked and there is
  // nothing to fetch. This condition used to read `enforce_member_consent`, a key
  // /school/settings does not return, so the query never ran and the gate had no
  // status to judge — the server was the first thing to notice.
  const consentApplies = isConsentRequiredForMember({
    isMinor: memberIsMinor,
    isUnder13: memberIsUnder13,
    settings: schoolSettings,
  });

  const consentQuery = useQuery({
    queryKey: ["studentConsentStatus", memberId, companyId],
    queryFn: () => fetchStudentConsent(companyId, memberId),
    enabled: Boolean(memberId) && consentApplies,
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

  const blocking = consentQuery.isSuccess
    ? isAssignmentBlockedByConsent({
        consentStatus,
        settings: schoolSettings,
        isMinor: memberIsMinor,
        isUnder13: memberIsUnder13,
      })
    : consentApplies && !hasValidConsent(member.consent);

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
