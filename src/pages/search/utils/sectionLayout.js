/**
 * Layout primitives shared by the search-results sections.
 *
 * Kept out of SearchSection.jsx on purpose: a module that exports both a React
 * component and plain values can't be hot-updated in place (React Fast Refresh
 * invalidates it and full-reloads every importer).
 */

/**
 * Card grid that spans the content width.
 *
 * `auto-fill` (not `auto-fit`) on purpose: auto-fit collapses the empty tracks,
 * which stretches a 3-result row into 630px-wide cards that are mostly
 * whitespace. auto-fill keeps every card a readable, consistent width and lets a
 * short row simply end.
 *
 * Keep minWidth at 280+ — below that the card titles wrap onto a second line.
 */
export const cardGrid = (minWidth = 280) => ({
  display: "grid",
  // min(100%, …) caps the track minimum at the container width, so a phone
  // narrower than minWidth gets one full-width card instead of a sideways scroll
  gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${minWidth}px), 1fr))`,
  gap: "16px",
  width: "100%",
});

/** Small uppercase divider for sections with more than one card group. */
export const SUBSECTION_LABEL = {
  fontFamily: "Inter",
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "18px",
  letterSpacing: "0.4px",
  textTransform: "uppercase",
  color: "var(--gray-500, #667085)",
  width: "100%",
  textAlign: "left",
  margin: "0 0 12px",
};

/** Right-aligned row for a section's pagination control. */
export const sectionFooter = {
  display: "flex",
  justifyContent: "flex-end",
  width: "100%",
  marginTop: "16px",
};

/** Muted note under a section, e.g. "showing the first N of M". */
export const SECTION_NOTE = {
  fontFamily: "Inter",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: "var(--gray-600, #475467)",
  width: "100%",
  textAlign: "right",
  margin: 0,
};
