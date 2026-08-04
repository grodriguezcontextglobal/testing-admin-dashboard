/**
 * "Fast forward" — end-of-year bulk grade advancement for students. `grade`
 * is a free-text field (no backend catalog/enum), so advancement here
 * follows a fixed, explicit sequence rather than blind numeric increment —
 * this lets "K" advance to "1" and lets grade 12 land on a distinct terminal
 * "Graduated" state instead of overflowing into "13".
 */
export const GRADE_SEQUENCE = [
  "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "Graduated",
];

const GRADE_INDEX_BY_LOWER = new Map(
  GRADE_SEQUENCE.map((grade, index) => [grade.toLowerCase(), index])
);

/**
 * Computes the next grade for a single student's current grade value.
 *
 * @param {string|null|undefined} currentGrade
 * @returns {{nextGrade: string, status: "advanced"|"graduated"|"already_graduated"|"unrecognized"}}
 */
export function getNextGrade(currentGrade) {
  const trimmed = String(currentGrade ?? "").trim();
  if (!trimmed) return { nextGrade: trimmed, status: "unrecognized" };

  const index = GRADE_INDEX_BY_LOWER.get(trimmed.toLowerCase());
  if (index === undefined) {
    return { nextGrade: trimmed, status: "unrecognized" };
  }

  const current = GRADE_SEQUENCE[index];
  if (current === "Graduated") {
    return { nextGrade: "Graduated", status: "already_graduated" };
  }

  const next = GRADE_SEQUENCE[index + 1];
  return { nextGrade: next, status: next === "Graduated" ? "graduated" : "advanced" };
}

/**
 * Builds a per-student preview/apply plan for a full member list — used
 * both to render the confirmation preview and to drive the actual updates.
 *
 * @param {Array<object>} members
 * @returns {Array<{member_id: *, first_name: string, last_name: string, currentGrade: string, nextGrade: string, status: string}>}
 */
export function buildGradeAdvancementPlan(members) {
  if (!Array.isArray(members)) return [];
  return members.map((m) => {
    const { nextGrade, status } = getNextGrade(m?.grade);
    return {
      member_id: m?.member_id,
      first_name: m?.first_name ?? "",
      last_name: m?.last_name ?? "",
      currentGrade: m?.grade ?? "",
      nextGrade,
      status,
    };
  });
}

/**
 * Counts each status bucket in a plan — drives the confirmation summary
 * ("X will advance, Y will graduate, Z need manual review...").
 *
 * @param {Array<{status: string}>} plan
 * @returns {{total: number, advanced: number, graduated: number, alreadyGraduated: number, unrecognized: number}}
 */
export function summarizeGradeAdvancementPlan(plan) {
  const list = Array.isArray(plan) ? plan : [];
  return {
    total: list.length,
    advanced: list.filter((p) => p.status === "advanced").length,
    graduated: list.filter((p) => p.status === "graduated").length,
    alreadyGraduated: list.filter((p) => p.status === "already_graduated").length,
    unrecognized: list.filter((p) => p.status === "unrecognized").length,
  };
}
