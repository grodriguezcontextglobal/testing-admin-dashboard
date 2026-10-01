/**
 * How many inventory cards per row in "Inventory assigned to event for
 * consumer uses" (meeting 2026-09-29 `1:03:39`: "Three you can do").
 *
 * Fixed columns rather than `auto-fit`: the count per row no longer depends on
 * the width, and a single card takes one column instead of the whole row.
 */
export const inventoryTileColumns = ({ small, medium }) => {
  if (small) return 1;
  if (medium) return 2;
  return 3;
};

/** minmax(0, …) so a long group name wraps inside its card, never past it. */
export const inventoryTileGridTemplate = (columns) =>
  `repeat(${columns}, minmax(0, 1fr))`;
