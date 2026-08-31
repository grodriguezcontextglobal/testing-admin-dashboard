import industriesList from "../components/navbar/component/industriesList.json";

/**
 * Industry profiles — per-industry configuration for the members module.
 * One adaptive module, industry-specific vocabulary and accountability rules:
 *  - audience:        what the people in this module are called (nav + titles)
 *  - icon:            iconify id for the dynamic nav tab
 *  - representative:  what the responsible adult is called and whether minors
 *                     require one before receiving devices
 *  - fields:          which member fields this industry uses
 *
 * Industries not listed fall back to `DEFAULT_PROFILE`; industries missing
 * from industriesList.json don't get the members section at all (unchanged).
 */

const DEFAULT_PROFILE = {
  icon: "tabler:users-group",
  // nav tabs this industry does NOT use (by navItems title)
  hiddenNavTabs: [],
  representative: {
    label: "Authorized representative",
    shortLabel: "Rep",
    requiredForMinors: true,
  },
  fields: { grade: false, homeroom: false, minor: true },
};

const PROFILES = {
  Education: {
    icon: "tabler:school",
    // students ARE the consumers in a school — the generic consumer/rental
    // track (deposits, event check-ins) doesn't apply and would bypass
    // guardian enforcement if used by mistake
    hiddenNavTabs: ["consumers"],
    representative: {
      label: "Parent / Guardian",
      shortLabel: "Rep",
      requiredForMinors: true,
    },
    fields: { grade: true, homeroom: true, minor: true },
  },
  "Healthcare and Social Assistance": {
    icon: "tabler:heart-plus",
    representative: {
      label: "Authorized representative",
      shortLabel: "Rep",
      requiredForMinors: true,
    },
    fields: { grade: false, homeroom: false, minor: true },
  },
  Construction: {
    icon: "tabler:helmet",
    representative: DEFAULT_PROFILE.representative,
    fields: { grade: false, homeroom: false, minor: false },
  },
  Hospitality: {
    icon: "tabler:building-skyscraper",
    representative: DEFAULT_PROFILE.representative,
    fields: { grade: false, homeroom: false, minor: false },
  },
};

/**
 * @param {string} industry the company's industry string
 * @returns {{audience: string|null, icon: string, representative: object, fields: object}}
 *   audience is null when the industry has no members section.
 */
export const getIndustryProfile = (industry) => {
  const audience = industriesList?.[industry]?.[0] ?? null;
  const profile = PROFILES[industry] ?? DEFAULT_PROFILE;
  return { audience, hiddenNavTabs: [], ...profile };
};

/**
 * The three kinds of holder a device can be assigned to, in one phrase.
 *
 * The add-inventory form asked "Is device assignable to staff/events?" and left
 * out the third: the people in the members module, who are handed devices
 * through the conditional page. What they are called is industry-specific, so
 * the question is asked in the company's own word for them — and falls back to
 * staff and events for an industry that has no members module at all, where
 * naming a third party would be a question about nothing.
 */
export const assignableTargetsLabel = (industry) => {
  const { audience } = getIndustryProfile(industry);
  return audience
    ? `staff, events or ${String(audience).toLowerCase()}`
    : "staff or events";
};

export default getIndustryProfile;

/**
 * The singular of an audience word.
 *
 * Every entry the directory currently serves is a regular `-s` plural
 * (Students, Patients, Contractors, End-users, IT Professionals), so dropping
 * the final `s` is enough — but only when it is really a plural. "Staff" and
 * "Press" are not, and a word ending in a double `s` never is, so both are left
 * as they are rather than being mangled into "Staf" if the directory grows.
 */
export const singularizeAudience = (word) => {
  const text = String(word ?? "").trim();
  if (!/s$/i.test(text) || /ss$/i.test(text)) return text;
  return text.slice(0, -1);
};

/**
 * What this company calls the people in its members module, ready to drop into
 * a sentence or a heading.
 *
 * The word comes from one place — the same `industriesList` entry that titles
 * the nav tab — so a school reads "Student" on every screen, a clinic reads
 * "Patient" and a rental company reads "Renter", without any of those words
 * being written into a component. An industry with no audience falls back to
 * "member", which is what the module was called before it learned to adapt.
 *
 * @param {string} industry the company's industry string
 * @returns {{singular: string, plural: string, Singular: string, Plural: string}}
 */
export const audienceWords = (industry) => {
  const { audience } = getIndustryProfile(industry);
  const Plural = String(audience ?? "").trim() || "Members";
  const Singular = singularizeAudience(Plural);
  return {
    singular: Singular.toLowerCase(),
    plural: Plural.toLowerCase(),
    Singular,
    Plural,
  };
};
