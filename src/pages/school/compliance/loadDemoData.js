/**
 * "Load demo roster" seeder for the school sales demo.
 *
 * Idempotent: creates only the demo students that don't already exist on the
 * company (matched by email), each with a real `date_of_birth` so the server's
 * derived minor / under-13 (COPPA) status is correct, and links a guardian for
 * every minor so the guardian-consent flow has someone to request consent from.
 *
 * Deliberately does NOT touch consent. Guardian consent is an OTC email flow —
 * the guardian receives a link and agrees on the public consent page — so an
 * "agreed" record cannot be fabricated from here, and calling
 * sendConsentRequest would send real email. Consent states for the demo must be
 * produced by driving the real flow (see demoRoster.js for the intended matrix).
 *
 * Backend writes: /db_member/new-member and /school/guardians/add on the
 * company passed in by the caller.
 */
import { devitrakApi } from "../../../api/devitrakApi";
import { DEMO_ROSTER } from "./demoRoster";
import {
  saveGuardian,
  searchGuardians,
} from "../../conditionalPage/utils/guardianConsentApi";
import {
  buildExistingGuardianLinkPayload,
  buildGuardianSearchPayload,
  buildNewGuardianLinkPayload,
  extractCreatedMemberId,
  normalizeGuardianEmail,
  selectGuardianByEmail,
} from "../../conditionalPage/utils/guardianConsentUtils";
import { calculateStudentAgeFlags } from "../../conditionalPage/utils/ageCalculationUtils";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const fetchMembers = async (companyId) => {
  const res = await devitrakApi.post("/db_member/consulting-member", {
    company_id: companyId,
  });
  return res?.data?.members ?? [];
};

const buildNewMemberPayload = (student, companyId) => {
  const flags = calculateStudentAgeFlags(student.date_of_birth);
  return {
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
    date_of_birth: student.date_of_birth ?? null,
    // minor is derived from DOB (COPPA); sent for the legacy column's sake
    minor: flags.dob_valid ? flags.minor : !!student.minor,
    parent_guardian_first_name: student.guardian?.first_name ?? "",
    parent_guardian_last_name: student.guardian?.last_name ?? "",
    parent_guardian_email: student.guardian?.email ?? "",
    parent_guardian_phone_number: student.guardian?.phone ?? "",
    company_id: companyId,
  };
};

/** Link (or create + link) the roster guardian for a student. */
const linkGuardian = async ({ companyId, memberId, guardian }) => {
  const email = normalizeGuardianEmail(guardian.email);
  const found = await searchGuardians(
    buildGuardianSearchPayload({ companyId, email })
  );
  const existing = selectGuardianByEmail(found?.guardians, email);
  if (existing) {
    await saveGuardian(
      buildExistingGuardianLinkPayload({
        companyId,
        memberId,
        guardianId: existing.id,
        relationship: "guardian",
      })
    );
    return;
  }
  await saveGuardian(
    buildNewGuardianLinkPayload({
      companyId,
      memberId,
      firstName: guardian.first_name,
      lastName: guardian.last_name,
      email,
      phoneNumber: guardian.phone,
      relationship: "guardian",
    })
  );
};

/**
 * Seed the demo roster onto `companyId`.
 * Returns { created, ensured, guardiansLinked, errors }.
 */
export const loadDemoData = async ({ companyId }) => {
  const summary = { created: 0, ensured: 0, guardiansLinked: 0, errors: [] };

  let existing = [];
  try {
    existing = await fetchMembers(companyId);
  } catch (e) {
    summary.errors.push(`Could not read existing members: ${e.message}`);
    return summary;
  }
  const idByEmail = new Map(
    existing.map((m) => [normalizeEmail(m.email), m.member_id ?? m.id])
  );

  // 1. Create whichever students are missing, remembering each new member_id.
  for (const student of DEMO_ROSTER) {
    const email = normalizeEmail(student.email);
    if (idByEmail.has(email)) {
      summary.ensured += 1;
      continue;
    }
    try {
      const res = await devitrakApi.post(
        "/db_member/new-member",
        buildNewMemberPayload(student, companyId)
      );
      summary.created += 1;
      const createdId = extractCreatedMemberId(res?.data ?? res);
      if (createdId) idByEmail.set(email, createdId);
    } catch (e) {
      summary.errors.push(`Create ${student.email}: ${e.message}`);
    }
  }

  // 2. If any create didn't hand back an id, re-read rather than skipping the
  //    guardian link — the link is idempotent server-side, so a re-read costs
  //    one request and keeps the roster complete.
  const unresolved = DEMO_ROSTER.some(
    (s) => s.guardian && !idByEmail.has(normalizeEmail(s.email))
  );
  if (unresolved) {
    try {
      const refreshed = await fetchMembers(companyId);
      refreshed.forEach((m) => {
        const email = normalizeEmail(m.email);
        if (!idByEmail.has(email)) idByEmail.set(email, m.member_id ?? m.id);
      });
    } catch (e) {
      summary.errors.push(`Could not re-read members after create: ${e.message}`);
    }
  }

  // 3. Link guardians for every roster student, not just the ones created on
  //    this run. Linking only after a successful create meant a second run —
  //    the idempotent path this loader promises — linked nobody, and a partial
  //    failure could never be repaired by running it again.
  for (const student of DEMO_ROSTER) {
    if (!student.guardian) continue;
    const memberId = idByEmail.get(normalizeEmail(student.email));
    if (!memberId) {
      summary.errors.push(
        `No member_id resolved for ${student.email}; guardian not linked.`
      );
      continue;
    }
    try {
      await linkGuardian({ companyId, memberId, guardian: student.guardian });
      summary.guardiansLinked += 1;
    } catch (e) {
      summary.errors.push(`Link guardian for ${student.email}: ${e.message}`);
    }
  }

  return summary;
};
