/**
 * "Fast forward" — end-of-year bulk grade advancement for students. `grade`
 * is a free-text field (no backend catalog/enum), so advancement here
 * follows a fixed, explicit sequence rather than blind numeric increment —
 * this lets "K" advance to "1" and lets grade 12 land on a distinct terminal
 * "Graduated" state instead of overflowing into "13".
 *
 * The sequence starts below kindergarten: early-childhood programs (PK3 for
 * three-year-olds, PK4 for four-year-olds) are a third of the roster at a
 * PK–5 school, and leaving them out stranded every one of those students in
 * the "needs manual review" bucket.
 */
export const GRADE_SEQUENCE = [
  "PK3", "PK4",
  "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "Graduated",
];

/**
 * Because `grade` is free text, the same school year arrives spelled a dozen
 * ways ("PK4", "pk-4", "Pre-K 4", "K4", "Grade 4"). Matching is done on a
 * compacted key — lowercased with every non-alphanumeric character removed —
 * so punctuation and spacing stop mattering.
 *
 * A bare "PK" / "Pre-K" is read as the year immediately before kindergarten
 * (the PK4 slot), which is the usual meaning at schools running a single
 * pre-K year.
 */
const GRADE_ALIASES = new Map(Object.entries({
  pk3: "PK3", prek3: "PK3", k3: "PK3", preschool3: "PK3", ps3: "PK3",
  prekindergarten3: "PK3", threesyearolds: "PK3",

  pk4: "PK4", prek4: "PK4", k4: "PK4", preschool4: "PK4", ps4: "PK4",
  prekindergarten4: "PK4",
  pk: "PK4", prek: "PK4", prekindergarten: "PK4", preschool: "PK4", ps: "PK4",

  k: "K", kindergarten: "K", kinder: "K", kg: "K",

  graduated: "Graduated", grad: "Graduated", alumni: "Graduated",
}));

const GRADE_INDEX = new Map(GRADE_SEQUENCE.map((grade, index) => [grade, index]));

/**
 * Resolves a free-text grade to its canonical entry in GRADE_SEQUENCE,
 * or null when it doesn't correspond to a known school year.
 *
 * @param {string} raw
 * @returns {string|null}
 */
function canonicalizeGrade(raw) {
  // Strip everything that isn't a letter or digit: "Pre-K 4" -> "prek4".
  let key = String(raw).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!key) return null;

  const direct = GRADE_ALIASES.get(key);
  if (direct) return direct;

  // "Grade 5" / "Gr. 5" / "GradeK" -> the bare year. The lookahead keeps this
  // from biting into "graduated", which is resolved as an alias above anyway.
  key = key.replace(/^(?:grade|gr)(?=[0-9kp])/, "");
  // Ordinals and zero-padding: "3rd" -> "3", "03" -> "3".
  key = key.replace(/^(\d+)(?:st|nd|rd|th)$/, "$1").replace(/^0+(?=\d)/, "");

  return GRADE_ALIASES.get(key)
    ?? (GRADE_INDEX.has(key.toUpperCase()) ? key.toUpperCase() : null);
}

/**
 * Computes the next grade for a single student's current grade value.
 *
 * @param {string|null|undefined} currentGrade
 * @returns {{nextGrade: string, status: "advanced"|"graduated"|"already_graduated"|"unrecognized"}}
 */
export function getNextGrade(currentGrade) {
  const trimmed = String(currentGrade ?? "").trim();
  if (!trimmed) return { nextGrade: trimmed, status: "unrecognized" };

  const current = canonicalizeGrade(trimmed);
  if (current === null) {
    return { nextGrade: trimmed, status: "unrecognized" };
  }

  if (current === "Graduated") {
    return { nextGrade: "Graduated", status: "already_graduated" };
  }

  const next = GRADE_SEQUENCE[GRADE_INDEX.get(current) + 1];
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
