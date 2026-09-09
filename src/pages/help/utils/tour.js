/**
 * The guided tours — the reading rules for content/tours.js.
 *
 * A tour is a mock screen plus an ordered walk over its regions. Both halves
 * are data, which is what lets the tests catch the two mistakes that otherwise
 * only show up when somebody takes the tour: a step aimed at a region the mock
 * does not draw (highlights nothing), and a step linking an article id that
 * does not exist (a dead end).
 */

const asArray = (value) => (Array.isArray(value) ? value : []);

/** The regions a mock draws, in the order it draws them. */
export const mockRegionIds = (mock) =>
  asArray(mock?.rows).map((row) => row.id);

/**
 * A step index that is always inside the tour. Returns 0 for an empty tour
 * rather than -1, so a caller can index without guarding first.
 */
export const clampStep = (index, total) => {
  if (!total || total < 1) return 0;
  return Math.min(Math.max(index, 0), total - 1);
};

export const getTour = (tours, sectionId) =>
  asArray(tours).find((tour) => tour.sectionId === sectionId) ?? null;

export const getMock = (mocks, mockId) =>
  asArray(mocks).find((mock) => mock.id === mockId) ?? null;

/** Step targets the mock has no region for. Empty means the tour is wired up. */
export const unknownStepTargets = (mock, tour) => {
  const regions = new Set(mockRegionIds(mock));
  return asArray(tour?.steps)
    .map((step) => step?.target)
    .filter((target) => !regions.has(target));
};
