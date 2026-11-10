/**
 * The SBOM attached to each release (fedRAMP/FRONTEND_action_plan_2026-10-26.md,
 * C4 · CM-8, SR-4). release.yml generates the full SBOM with `npm sbom`
 * (CycloneDX, from the lockfile); productionOnly keeps the production packages
 * and stampSbom stamps it with the release tag, refusing an SBOM that would
 * describe nothing.
 *
 *   node scripts/sbom-stamp.js <npm-sbom.json> <tag> <out.json>
 */

// "node_modules/a/node_modules/@scope/b" → "@scope/b".
const packageName = (lockPath, entry) => entry.name ?? lockPath.slice(lockPath.lastIndexOf("node_modules/") + 13);

/**
 * Only the production packages of a full `npm sbom` (GovRAMP #14).
 *
 * `npm sbom --omit dev` (npm 11) drops production packages that a dev tool
 * also depends on: the release SBOM of 2026-11-10 had no react, react-dom,
 * lodash or workbox-*. The lockfile's own `dev` flag is right, so the full
 * SBOM is filtered by it here. Throws if a direct production dependency is
 * still missing, so an incomplete SBOM never ships.
 */
export const productionOnly = (sbom, lock) => {
  const packages = lock?.packages;
  if (!packages || !packages[""]) throw new Error("The lockfile has no packages: is it a v2/v3 lockfile?");
  const production = new Set(
    Object.entries(packages)
      .filter(([lockPath, entry]) => lockPath !== "" && !entry.dev && !entry.link && entry.version)
      .map(([lockPath, entry]) => `${packageName(lockPath, entry)}@${entry.version}`)
  );
  const rootRef = sbom?.metadata?.component?.["bom-ref"];
  const components = (sbom?.components ?? []).filter((component) => production.has(component["bom-ref"]));
  const kept = new Set(components.map((component) => component["bom-ref"]));

  const missing = Object.keys(packages[""].dependencies ?? {})
    .map((name) => `${name}@${packages[`node_modules/${name}`]?.version}`)
    .filter((ref) => !kept.has(ref));
  if (missing.length) throw new Error(`The SBOM misses direct production dependencies: ${missing.join(", ")}`);

  const dependencies = (sbom?.dependencies ?? [])
    .filter((entry) => entry.ref === rootRef || kept.has(entry.ref))
    .map((entry) => ({ ...entry, dependsOn: (entry.dependsOn ?? []).filter((ref) => kept.has(ref)) }));
  return { ...sbom, components, dependencies };
};

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
