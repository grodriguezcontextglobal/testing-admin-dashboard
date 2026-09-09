import { describe, expect, it } from "vitest";
import { DASHBOARD_MOCKS, SECTION_TOURS } from "../content/tours";
import { MANUAL_SECTIONS } from "../content";
import { findArticle } from "./manual";
import {
  clampStep,
  getMock,
  getTour,
  mockRegionIds,
  unknownStepTargets,
} from "./tour";

const MOCK = {
  id: "demo",
  title: "Demo screen",
  rows: [
    { id: "nav", kind: "nav", label: "Navigation" },
    { id: "table", kind: "table", label: "A table" },
  ],
};

const TOUR = {
  sectionId: "demo",
  mockId: "demo",
  steps: [
    { target: "nav", title: "The nav", text: "Where you are." },
    { target: "table", title: "The table", text: "What you have.", article: "events-close" },
  ],
};

describe("mockRegionIds", () => {
  it("lists every region the mock draws", () => {
    expect(mockRegionIds(MOCK)).toEqual(["nav", "table"]);
  });

  it("is empty rather than undefined for a mock with no rows", () => {
    expect(mockRegionIds({ id: "x" })).toEqual([]);
    expect(mockRegionIds(undefined)).toEqual([]);
  });
});

describe("clampStep", () => {
  it("keeps an index inside the tour", () => {
    expect(clampStep(0, 3)).toBe(0);
    expect(clampStep(2, 3)).toBe(2);
  });

  it("does not walk off either end", () => {
    expect(clampStep(-1, 3)).toBe(0);
    expect(clampStep(3, 3)).toBe(2);
    expect(clampStep(99, 3)).toBe(2);
  });

  it("answers 0 for a tour with no steps rather than -1", () => {
    expect(clampStep(0, 0)).toBe(0);
    expect(clampStep(5, 0)).toBe(0);
  });
});

describe("getTour / getMock", () => {
  it("finds a section's tour and the mock it draws", () => {
    expect(getTour([TOUR], "demo")).toBe(TOUR);
    expect(getMock([MOCK], "demo")).toBe(MOCK);
  });

  it("returns null when a section has no tour, so the button can be hidden", () => {
    expect(getTour([TOUR], "nothing")).toBeNull();
    expect(getMock([MOCK], "nothing")).toBeNull();
    expect(getTour(undefined, "demo")).toBeNull();
  });
});

describe("unknownStepTargets", () => {
  it("is empty when every step points at a region the mock draws", () => {
    expect(unknownStepTargets(MOCK, TOUR)).toEqual([]);
  });

  it("names a target the mock does not have — a step that would highlight nothing", () => {
    const broken = {
      ...TOUR,
      steps: [...TOUR.steps, { target: "ghost", title: "?", text: "?" }],
    };
    expect(unknownStepTargets(MOCK, broken)).toEqual(["ghost"]);
  });
});

/* The content itself, checked rather than trusted: a typo in a target is a step
   that highlights nothing, and a typo in an article id is a dead link out of
   the tour. Neither shows up until somebody takes the tour. */
describe("the shipped tours", () => {
  it("every tour draws a mock that exists", () => {
    SECTION_TOURS.forEach((tour) => {
      expect(getMock(DASHBOARD_MOCKS, tour.mockId), tour.sectionId).toBeTruthy();
    });
  });

  it("every step highlights a region its mock actually draws", () => {
    SECTION_TOURS.forEach((tour) => {
      const mock = getMock(DASHBOARD_MOCKS, tour.mockId);
      expect(unknownStepTargets(mock, tour)).toEqual([]);
    });
  });

  it("every step that links an article links one that exists", () => {
    SECTION_TOURS.forEach((tour) => {
      tour.steps.forEach((step) => {
        if (!step.article) return;
        expect(findArticle(MANUAL_SECTIONS, step.article), step.article).toBeTruthy();
      });
    });
  });

  it("every tour belongs to a section of the manual", () => {
    const sectionIds = MANUAL_SECTIONS.map((section) => section.id);
    SECTION_TOURS.forEach((tour) => {
      expect(sectionIds).toContain(tour.sectionId);
    });
  });

  it("every step says something — a highlight with no words is not a step", () => {
    SECTION_TOURS.forEach((tour) => {
      expect(tour.steps.length).toBeGreaterThan(0);
      tour.steps.forEach((step) => {
        expect(step.title).toBeTruthy();
        expect(step.text).toBeTruthy();
      });
    });
  });
});
