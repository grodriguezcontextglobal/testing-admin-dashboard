import { describe, expect, it } from "vitest";
import { stampSbom } from "./sbom";

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
