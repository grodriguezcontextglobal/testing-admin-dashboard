/**
 * "Load demo data" seeder for the school sales demo.
 *
 * Idempotent: creates only the demo students that don't already exist on the
 * company (matched by email), then resolves every student's member_id and
 * stages their DOB + guardian consent client-side. Safe to run more than once —
 * it won't create duplicates.
 *
 * Backend writes are limited to /db_member/new-member on the current company
 * (the caller decides which company). No emails are sent (the .test roster
 * addresses never leave the app). The compliance layer (DOB + consent) is
 * purely client-side staging.
 */
import { devitrakApi } from "../../../api/devitrakApi";
import { DEMO_ROSTER } from "./demoRoster";
import { recordStagedConsent, resetStagedConsent } from "./stagedConsentStore";
import { resetStagedDob, setStagedDob } from "./stagedProfileStore";
import { DEFAULT_POLICY_VERSION } from "./consentModel";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const fetchMembers = async (companyId) => {
  const res = await devitrakApi.post("/db_member/consulting-member", {
    company_id: companyId,
  });
  return res?.data?.members ?? [];
};

const buildNewMemberPayload = (student, companyId) => ({
  first_name: student.first_name,
  last_name: student.last_name,
  email: student.email,
  phone: student.phone,
  address_street: "",
  address_city: student.school ?? "",
  address_state: "CA",
  address_zip: "",
  address: `, ${student.school ?? ""}, CA `,
  grade: student.grade ?? "",
  homeroom: student.homeroom ?? "",
  minor: !!student.minor,
  parent_guardian_first_name: student.guardian?.first_name ?? "",
  parent_guardian_last_name: student.guardian?.last_name ?? "",
  parent_guardian_email: student.guardian?.email ?? "",
  parent_guardian_phone_number: student.guardian?.phone ?? "",
  company_id: companyId,
});

/**
 * Seed the demo roster onto `companyId` and stage each student's DOB + consent.
 * Returns a summary { created, ensured, stagedDob, stagedConsent, errors }.
 */
export const loadDemoData = async ({ companyId }) => {
  const summary = {
    created: 0,
    ensured: 0,
    stagedDob: 0,
    stagedConsent: 0,
    errors: [],
  };

  let existing = [];
  try {
    existing = await fetchMembers(companyId);
  } catch (e) {
    summary.errors.push(`Could not read existing members: ${e.message}`);
    return summary;
  }
  const existingEmails = new Set(existing.map((m) => normalizeEmail(m.email)));

  // 1. Create any missing students (idempotent by email).
  for (const student of DEMO_ROSTER) {
    if (existingEmails.has(normalizeEmail(student.email))) {
      summary.ensured += 1;
      continue;
    }
    try {
      await devitrakApi.post(
        "/db_member/new-member",
        buildNewMemberPayload(student, companyId)
      );
      summary.created += 1;
    } catch (e) {
      summary.errors.push(`Create ${student.email}: ${e.message}`);
    }
  }

  // 2. Re-fetch (if we created anything) to resolve member_ids.
  let all = existing;
  if (summary.created > 0) {
    try {
      all = await fetchMembers(companyId);
    } catch (e) {
      summary.errors.push(`Could not re-read members after create: ${e.message}`);
    }
  }
  const idByEmail = new Map(
    all.map((m) => [normalizeEmail(m.email), m.member_id ?? m.id])
  );

  // 3. Stage DOB + consent for every student we can resolve.
  for (const student of DEMO_ROSTER) {
    const memberId = idByEmail.get(normalizeEmail(student.email));
    if (memberId == null) {
      summary.errors.push(`No member_id resolved for ${student.email}`);
      continue;
    }
    if (student.date_of_birth) {
      setStagedDob(memberId, student.date_of_birth);
      summary.stagedDob += 1;
    }
    if (student.consent === "valid" || student.consent === "outdated") {
      recordStagedConsent({
        member_id: memberId,
        signer_name: `${student.guardian?.first_name ?? ""} ${
          student.guardian?.last_name ?? ""
        }`.trim(),
        signer_email: student.guardian?.email ?? "",
        policy_type: "AUP",
        policy_version:
          student.consent === "outdated" ? "0" : DEFAULT_POLICY_VERSION,
        method: "e-signature",
      });
      summary.stagedConsent += 1;
    }
  }

  return summary;
};

/**
 * Clear the staged compliance layer (DOB + consent) for a clean demo re-run.
 * Client-side only — does NOT delete the seeded members.
 */
export const resetStagedDemoData = () => {
  resetStagedConsent();
  resetStagedDob();
};
