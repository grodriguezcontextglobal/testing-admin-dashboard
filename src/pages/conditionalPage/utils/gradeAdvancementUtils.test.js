import { describe, expect, it } from "vitest";
import {
  GRADE_SEQUENCE,
  buildGradeAdvancementPlan,
  getNextGrade,
  summarizeGradeAdvancementPlan,
} from "./gradeAdvancementUtils";

describe("getNextGrade", () => {
  it("advances a numeric grade to the next one in sequence", () => {
    expect(getNextGrade("6")).toEqual({ nextGrade: "7", status: "advanced" });
    expect(getNextGrade("7")).toEqual({ nextGrade: "8", status: "advanced" });
  });

  it("advances 'K' to '1'", () => {
    expect(getNextGrade("K")).toEqual({ nextGrade: "1", status: "advanced" });
    expect(getNextGrade("k")).toEqual({ nextGrade: "1", status: "advanced" });
  });

  it("advances grade 12 to 'Graduated'", () => {
    expect(getNextGrade("12")).toEqual({ nextGrade: "Graduated", status: "graduated" });
  });

  it("keeps an already-graduated student graduated (terminal, idempotent)", () => {
    expect(getNextGrade("Graduated")).toEqual({
      nextGrade: "Graduated",
      status: "already_graduated",
    });
    expect(getNextGrade("graduated")).toEqual({
      nextGrade: "Graduated",
      status: "already_graduated",
    });
  });

  it("is case-insensitive and trims whitespace when matching the sequence", () => {
    expect(getNextGrade("  7  ")).toEqual({ nextGrade: "8", status: "advanced" });
  });

  it("advances the early-childhood years into kindergarten", () => {
    expect(getNextGrade("PK3")).toEqual({ nextGrade: "PK4", status: "advanced" });
    expect(getNextGrade("PK4")).toEqual({ nextGrade: "K", status: "advanced" });
  });

  it("accepts the many spellings of pre-K that a free-text field collects", () => {
    for (const value of ["PK3", "pk3", "PK-3", "PK 3", "Pre-K 3", "PreK3", "K3", "Preschool 3"]) {
      expect(getNextGrade(value)).toEqual({ nextGrade: "PK4", status: "advanced" });
    }
    for (const value of ["PK4", "pk-4", "Pre-K 4", "PreK4", "K4"]) {
      expect(getNextGrade(value)).toEqual({ nextGrade: "K", status: "advanced" });
    }
  });

  it("reads a bare 'Pre-K' as the year before kindergarten", () => {
    expect(getNextGrade("Pre-K")).toEqual({ nextGrade: "K", status: "advanced" });
    expect(getNextGrade("PK")).toEqual({ nextGrade: "K", status: "advanced" });
    expect(getNextGrade("Pre-Kindergarten")).toEqual({ nextGrade: "K", status: "advanced" });
  });

  it("tolerates 'Grade N' prefixes, ordinals and zero padding", () => {
    expect(getNextGrade("Grade 5")).toEqual({ nextGrade: "6", status: "advanced" });
    expect(getNextGrade("Gr. 5")).toEqual({ nextGrade: "6", status: "advanced" });
    expect(getNextGrade("3rd")).toEqual({ nextGrade: "4", status: "advanced" });
    expect(getNextGrade("03")).toEqual({ nextGrade: "4", status: "advanced" });
    expect(getNextGrade("Kindergarten")).toEqual({ nextGrade: "1", status: "advanced" });
  });

  it("still treats a genuinely unknown value as unrecognized and leaves it unchanged", () => {
    expect(getNextGrade("Transition")).toEqual({ nextGrade: "Transition", status: "unrecognized" });
    expect(getNextGrade("N/A")).toEqual({ nextGrade: "N/A", status: "unrecognized" });
    expect(getNextGrade("13")).toEqual({ nextGrade: "13", status: "unrecognized" });
  });

  it("marks empty/null/undefined grade as unrecognized", () => {
    expect(getNextGrade("")).toEqual({ nextGrade: "", status: "unrecognized" });
    expect(getNextGrade(null)).toEqual({ nextGrade: "", status: "unrecognized" });
    expect(getNextGrade(undefined)).toEqual({ nextGrade: "", status: "unrecognized" });
  });

  it("exposes the full PK3-12-Graduated sequence", () => {
    expect(GRADE_SEQUENCE).toEqual([
      "PK3", "PK4",
      "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "Graduated",
    ]);
  });
});

describe("buildGradeAdvancementPlan", () => {
  const members = [
    { member_id: 1, first_name: "Alex", last_name: "One", grade: "6" },
    { member_id: 2, first_name: "Sam", last_name: "Two", grade: "12" },
    { member_id: 3, first_name: "Jo", last_name: "Three", grade: "Graduated" },
    { member_id: 4, first_name: "Ray", last_name: "Four", grade: "Transition" },
    { member_id: 5, first_name: "Ana", last_name: "Five", grade: "PK3" },
  ];

  it("returns [] for non-array input", () => {
    expect(buildGradeAdvancementPlan(null)).toEqual([]);
  });

  it("builds one plan entry per member with the computed next grade and status", () => {
    const plan = buildGradeAdvancementPlan(members);
    expect(plan).toEqual([
      { member_id: 1, first_name: "Alex", last_name: "One", currentGrade: "6", nextGrade: "7", status: "advanced" },
      { member_id: 2, first_name: "Sam", last_name: "Two", currentGrade: "12", nextGrade: "Graduated", status: "graduated" },
      { member_id: 3, first_name: "Jo", last_name: "Three", currentGrade: "Graduated", nextGrade: "Graduated", status: "already_graduated" },
      { member_id: 4, first_name: "Ray", last_name: "Four", currentGrade: "Transition", nextGrade: "Transition", status: "unrecognized" },
      { member_id: 5, first_name: "Ana", last_name: "Five", currentGrade: "PK3", nextGrade: "PK4", status: "advanced" },
    ]);
  });
});

describe("summarizeGradeAdvancementPlan", () => {
  it("counts each status bucket", () => {
    const plan = buildGradeAdvancementPlan([
      { member_id: 1, grade: "6" },
      { member_id: 2, grade: "7" },
      { member_id: 3, grade: "12" },
      { member_id: 4, grade: "Graduated" },
      { member_id: 5, grade: "Transition" },
      { member_id: 6, grade: "PK3" },
    ]);
    expect(summarizeGradeAdvancementPlan(plan)).toEqual({
      total: 6,
      advanced: 3,
      graduated: 1,
      alreadyGraduated: 1,
      unrecognized: 1,
    });
  });

  it("returns all-zero counts for an empty plan", () => {
    expect(summarizeGradeAdvancementPlan([])).toEqual({
      total: 0,
      advanced: 0,
      graduated: 0,
      alreadyGraduated: 0,
      unrecognized: 0,
    });
  });
});
