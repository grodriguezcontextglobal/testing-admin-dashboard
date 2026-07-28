/**
 * Age calculation utilities for student/member DOB.
 *
 * Converts a date_of_birth string into age, minor status, and under-13
 * status. Used by the member create form and Excel import to replace
 * manual minor checkbox with DOB-driven calculation.
 */

/**
 * Calculate age from a date of birth string.
 * @param {string} dob - ISO date string (YYYY-MM-DD)
 * @returns {number|null} age in years, or null if invalid/future
 */
export function calculateAge(dob) {
  if (!dob || typeof dob !== "string") return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  // Future DOB is invalid
  if (birthDate > today) return null;

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * True when the student is under 18 (minor).
 * @param {string} dob
 * @returns {boolean}
 */
export function isMinor(dob) {
  const age = calculateAge(dob);
  return age !== null && age < 18;
}

/**
 * True when the student is under 13 (COPPA threshold).
 * @param {string} dob
 * @returns {boolean}
 */
export function isUnder13(dob) {
  const age = calculateAge(dob);
  return age !== null && age < 13;
}

/**
 * Calculate all age-related flags from a DOB.
 * @param {string} dob
 * @returns {{ age: number|null, minor: boolean, under_13: boolean, dob_valid: boolean }}
 */
export function calculateStudentAgeFlags(dob) {
  const age = calculateAge(dob);
  return {
    age,
    minor: age !== null && age < 18,
    under_13: age !== null && age < 13,
    dob_valid: age !== null,
  };
}

export const calculateAgeFlags = calculateStudentAgeFlags;
