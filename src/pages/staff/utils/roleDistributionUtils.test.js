import { describe, it, expect } from "vitest";
import { getRoleLabel, getRoleLabelGroupKey } from "../../../config/roles";
import { buildRoleDistribution } from "./roleDistributionUtils";

// Same resolution useRoleLabel does, without needing a Redux store.
const makeRoleLabel = (companyRoleLabels) => (roleType) =>
  companyRoleLabels?.[getRoleLabelGroupKey(roleType)] || getRoleLabel(roleType);

const roleLabel = makeRoleLabel(undefined);
const COLORS = ["#021833", "#155eef", "#35465c", "#9a9d93", "#c6c7bb"];
const named = (slices) => slices.map((s) => [s.name, s.value]);

describe("buildRoleDistribution — legacy numeric roles", () => {
  it("labels every legacy level, not just 0/1/2", () => {
    const employees = ["0", "1", "2", "3", "4", "5"].map((role) => ({ role }));
    expect(named(buildRoleDistribution(employees, roleLabel, COLORS))).toEqual([
      ["Root Administrator", 1],
      ["Administrator", 1],
      ["Sale Manager", 1],
      ["Event Manager", 1],
      ["Inventory Manager", 1],
      ["Assistant", 1],
    ]);
  });

  it("accepts numbers as well as numeric strings", () => {
    expect(
      named(buildRoleDistribution([{ role: 1 }, { role: "1" }], roleLabel, COLORS))
    ).toEqual([["Administrator", 2]]);
  });
});

describe("buildRoleDistribution — scoped roles (the NaN-bucket regression)", () => {
  it("gives each scoped role its own named slice instead of one 'NaN' wedge", () => {
    const employees = [
      { role: "category_manager" },
      { role: "inventory_location_manager" },
      { role: "category_assistant" },
    ];
    const slices = buildRoleDistribution(employees, roleLabel, COLORS);
    expect(named(slices)).toEqual([
      ["Category Assistant", 1],
      ["Category Manager", 1],
      ["Inventory Location Manager", 1],
    ]);
    expect(slices.map((s) => s.name)).not.toContain("NaN");
  });

  it("never leaves a slice without a color (ROLE_COLORS[NaN] used to)", () => {
    const slices = buildRoleDistribution(
      [{ role: "category_manager" }, { role: "0" }],
      roleLabel,
      COLORS
    );
    expect(slices.every((s) => COLORS.includes(s.itemStyle.color))).toBe(true);
  });

  it("keeps legacy and scoped roles as separate slices in one company", () => {
    const employees = [
      { role: "0" },
      { role: "1" },
      { role: "1" },
      { role: "category_manager" },
      { role: "category_assistant" },
    ];
    expect(named(buildRoleDistribution(employees, roleLabel, COLORS))).toEqual([
      ["Root Administrator", 1],
      ["Administrator", 2],
      ["Category Assistant", 1],
      ["Category Manager", 1],
    ]);
  });
});

describe("buildRoleDistribution — concept grouping", () => {
  it("merges the legacy and canonical spelling of the same role", () => {
    const employees = [
      { role: "1" },
      { roleType: "admin" },
      { role: "5" },
      { roleType: "associate_inventory" },
    ];
    expect(named(buildRoleDistribution(employees, roleLabel, COLORS))).toEqual([
      ["Administrator", 2],
      ["Assistant", 2],
    ]);
  });

  it("prefers roleType over a stale numeric role", () => {
    expect(
      named(
        buildRoleDistribution(
          [{ role: "5", roleType: "category_manager" }],
          roleLabel,
          COLORS
        )
      )
    ).toEqual([["Category Manager", 1]]);
  });

  it("produces one slice per concept, so legend React keys stay unique", () => {
    const slices = buildRoleDistribution(
      [{ role: "1" }, { roleType: "admin" }, { role: "0" }],
      roleLabel,
      COLORS
    );
    expect(new Set(slices.map((s) => s.name)).size).toBe(slices.length);
  });
});

describe("buildRoleDistribution — ordering", () => {
  it("ranks most- to least-privileged regardless of input order", () => {
    const employees = [
      { role: "5" },
      { role: "0" },
      { role: "3" },
      { role: "1" },
    ];
    expect(named(buildRoleDistribution(employees, roleLabel, COLORS))).toEqual([
      ["Root Administrator", 1],
      ["Administrator", 1],
      ["Event Manager", 1],
      ["Assistant", 1],
    ]);
  });

  it("puts the level-less scoped roles after the ranked ones", () => {
    const slices = buildRoleDistribution(
      [{ role: "category_manager" }, { role: "5" }, { role: "0" }],
      roleLabel,
      COLORS
    );
    expect(slices.at(-1).name).toBe("Category Manager");
  });

  it("orders level-less roles by key, not by roster order", () => {
    const forward = buildRoleDistribution(
      [{ role: "inventory_location_manager" }, { role: "category_manager" }],
      roleLabel,
      COLORS
    );
    const reversed = buildRoleDistribution(
      [{ role: "category_manager" }, { role: "inventory_location_manager" }],
      roleLabel,
      COLORS
    );
    expect(named(forward)).toEqual(named(reversed));
  });
});

describe("buildRoleDistribution — company-renamed labels", () => {
  it("uses the company's own label over the built-in one", () => {
    const custom = makeRoleLabel({
      assistant: "Docente",
      category_manager: "Coordinador de Área",
    });
    expect(
      buildRoleDistribution(
        [{ role: "5" }, { role: "category_manager" }],
        custom,
        COLORS
      ).map((s) => s.name)
    ).toEqual(["Docente", "Coordinador de Área"]);
  });

  it("applies the override to the canonical spelling of the same concept", () => {
    const custom = makeRoleLabel({ assistant: "Docente" });
    expect(
      named(
        buildRoleDistribution(
          [{ roleType: "associate_inventory" }, { role: "5" }],
          custom,
          COLORS
        )
      )
    ).toEqual([["Docente", 2]]);
  });
});

describe("buildRoleDistribution — edge cases", () => {
  it("returns [] for an empty roster, so the caller shows its empty state", () => {
    expect(buildRoleDistribution([], roleLabel, COLORS)).toEqual([]);
  });

  it("tolerates a missing or non-array roster", () => {
    expect(buildRoleDistribution(undefined, roleLabel, COLORS)).toEqual([]);
    expect(buildRoleDistribution(null, roleLabel, COLORS)).toEqual([]);
  });

  it("skips members with no resolvable role rather than bucketing them", () => {
    const slices = buildRoleDistribution(
      [{ role: "1" }, {}, { role: undefined }, { role: "" }],
      roleLabel,
      COLORS
    );
    expect(named(slices)).toEqual([["Administrator", 1]]);
  });

  // Number("") and Number(null) are both 0, and LEGACY_ROLE_MAP[0] is
  // root_admin — so a blank role must be dropped before it can be counted as
  // the most privileged role on the chart.
  it("never counts a blank role as Root Administrator", () => {
    for (const blank of [{ role: "" }, { role: null }, { roleType: "" }]) {
      expect(buildRoleDistribution([blank], roleLabel, COLORS)).toEqual([]);
    }
  });

  it("does not throw when no palette is supplied", () => {
    const slices = buildRoleDistribution([{ role: "1" }], roleLabel);
    expect(slices[0].itemStyle.color).toBeUndefined();
  });
});
