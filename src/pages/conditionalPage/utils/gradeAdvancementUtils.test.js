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

  it("marks an unrecognized grade as unrecognized and leaves it unchanged", () => {
    expect(getNextGrade("Pre-K")).toEqual({ nextGrade: "Pre-K", status: "unrecognized" });
    expect(getNextGrade("Grade 5")).toEqual({ nextGrade: "Grade 5", status: "unrecognized" });
  });

  it("marks empty/null/undefined grade as unrecognized", () => {
    expect(getNextGrade("")).toEqual({ nextGrade: "", status: "unrecognized" });
    expect(getNextGrade(null)).toEqual({ nextGrade: "", status: "unrecognized" });
    expect(getNextGrade(undefined)).toEqual({ nextGrade: "", status: "unrecognized" });
  });

  it("exposes the full K-12-Graduated sequence", () => {
    expect(GRADE_SEQUENCE).toEqual([
      "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "Graduated",
    ]);
  });
});

describe("buildGradeAdvancementPlan", () => {
  const members = [
    { member_id: 1, first_name: "Alex", last_name: "One", grade: "6" },
    { member_id: 2, first_name: "Sam", last_name: "Two", grade: "12" },
    { member_id: 3, first_name: "Jo", last_name: "Three", grade: "Graduated" },
    { member_id: 4, first_name: "Ray", last_name: "Four", grade: "Pre-K" },
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
      { member_id: 4, first_name: "Ray", last_name: "Four", currentGrade: "Pre-K", nextGrade: "Pre-K", status: "unrecognized" },
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
      { member_id: 5, grade: "Pre-K" },
    ]);
    expect(summarizeGradeAdvancementPlan(plan)).toEqual({
      total: 5,
      advanced: 2,
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
