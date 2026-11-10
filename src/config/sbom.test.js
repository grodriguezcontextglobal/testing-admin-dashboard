import { describe, expect, it } from "vitest";
import { productionOnly, stampSbom } from "./sbom";

// fedRAMP C4: the CycloneDX SBOM attached to each release must name the
// release it describes; npm sbom writes package.json's version (0.0.0).

const bom = (overrides = {}) => ({
  bomFormat: "CycloneDX",
  specVersion: "1.5",
  metadata: { component: { name: "testing-admin-dashboard", version: "0.0.0" } },
  components: [{ name: "react", version: "18.3.1", purl: "pkg:npm/react@18.3.1" }],
  ...overrides,
});

describe("stampSbom", () => {
  it("sets the application's version to the release tag", () => {
    const stamped = stampSbom(bom(), "admin-20261102-120000-abc1234");
    expect(stamped.metadata.component.version).toBe("admin-20261102-120000-abc1234");
    expect(stamped.components).toHaveLength(1);
  });

  it("does not change its input", () => {
    const input = bom();
    stampSbom(input, "admin-x");
    expect(input.metadata.component.version).toBe("0.0.0");
  });

  it("refuses something that is not a CycloneDX SBOM", () => {
    expect(() => stampSbom({ spdxVersion: "SPDX-2.3" }, "admin-x")).toThrow(/CycloneDX/);
  });

  it("refuses an empty SBOM, so a broken lockfile never ships as 'no dependencies'", () => {
    expect(() => stampSbom(bom({ components: [] }), "admin-x")).toThrow(/no components/);
  });

  it("refuses a missing tag", () => {
    expect(() => stampSbom(bom(), "")).toThrow(/tag/);
  });
});

// GovRAMP #14 (CM-8, SR-4): `npm sbom --omit dev` (npm 11) leaves out
// production packages that a dev tool also depends on. The release SBOM of
// 2026-11-10 had no react, react-dom, lodash or workbox-*. The release now
// takes the full SBOM and drops what the lockfile marks dev.
describe("productionOnly", () => {
  const lock = {
    packages: {
      "": { name: "admin-dashboard-vite", dependencies: { react: "^18.3.1", "@scope/ui": "^1.0.0" }, devDependencies: { vite: "^6.4.5" } },
      "node_modules/react": { version: "18.3.1" },
      "node_modules/@scope/ui": { version: "1.0.0" },
      "node_modules/@scope/ui/node_modules/loose-envify": { version: "1.4.0" },
      "node_modules/vite": { version: "6.4.5", dev: true },
      "node_modules/rollup": { version: "4.0.0", dev: true },
      "node_modules/fsevents": { version: "2.3.3", optional: true },
    },
  };
  const full = bom({
    metadata: { component: { "bom-ref": "admin-dashboard-vite@0.0.0", name: "admin-dashboard-vite", version: "0.0.0" } },
    components: ["react@18.3.1", "@scope/ui@1.0.0", "loose-envify@1.4.0", "vite@6.4.5", "rollup@4.0.0", "fsevents@2.3.3"].map(
      (ref) => ({ "bom-ref": ref, name: ref.slice(0, ref.lastIndexOf("@")), version: ref.slice(ref.lastIndexOf("@") + 1) })
    ),
    dependencies: [
      { ref: "admin-dashboard-vite@0.0.0", dependsOn: ["react@18.3.1", "@scope/ui@1.0.0", "vite@6.4.5"] },
      { ref: "@scope/ui@1.0.0", dependsOn: ["loose-envify@1.4.0"] },
      { ref: "vite@6.4.5", dependsOn: ["rollup@4.0.0", "react@18.3.1"] },
    ],
  });
  const refs = (sbom) => sbom.components.map((component) => component["bom-ref"]).sort();

  it("keeps every package the lockfile does not mark dev, nested and scoped ones included", () => {
    expect(refs(productionOnly(full, lock))).toEqual(["@scope/ui@1.0.0", "fsevents@2.3.3", "loose-envify@1.4.0", "react@18.3.1"]);
  });

  // react is also a dependency of a dev tool here, which is what npm got wrong.
  it("keeps a production package a dev tool also depends on", () => {
    expect(refs(productionOnly(full, lock))).toContain("react@18.3.1");
  });

  it("drops the dev tools and their edges from the dependency graph", () => {
    const { dependencies } = productionOnly(full, lock);
    expect(dependencies.map((entry) => entry.ref)).toEqual(["admin-dashboard-vite@0.0.0", "@scope/ui@1.0.0"]);
    expect(dependencies[0].dependsOn).toEqual(["react@18.3.1", "@scope/ui@1.0.0"]);
  });

  it("refuses an SBOM that misses a direct production dependency", () => {
    const withoutReact = { ...full, components: full.components.filter((component) => component.name !== "react") };
    expect(() => productionOnly(withoutReact, lock)).toThrow(/react@18\.3\.1/);
  });

  it("refuses a lockfile it cannot read", () => {
    expect(() => productionOnly(full, {})).toThrow(/lockfile/);
  });
});
