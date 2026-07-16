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

export default getIndustryProfile;
