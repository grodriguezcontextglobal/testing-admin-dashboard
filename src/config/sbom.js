/**
 * The SBOM attached to each release (fedRAMP/FRONTEND_action_plan_2026-10-26.md,
 * C4 · CM-8, SR-4). release.yml generates it with `npm sbom` (CycloneDX,
 * production dependencies, from the lockfile); this stamps it with the release
 * tag and refuses an SBOM that would describe nothing.
 *
 *   node scripts/sbom-stamp.js <npm-sbom.json> <tag> <out.json>
 */

export const stampSbom = (sbom, tag) => {
  if (sbom?.bomFormat !== "CycloneDX") throw new Error("Not a CycloneDX SBOM");
  if (!Array.isArray(sbom.components) || sbom.components.length === 0) {
    throw new Error("The SBOM has no components: is the lockfile intact?");
  }
  if (!String(tag ?? "").trim()) throw new Error("A release tag is required");
  return {
    ...sbom,
    metadata: { ...sbom.metadata, component: { ...sbom.metadata?.component, version: tag } },
  };
};
