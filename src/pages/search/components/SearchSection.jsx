import { PropTypes } from "prop-types";

/**
 * Shared frame for every block on the search-results page: heading on top, cards
 * filling the full content width underneath.
 *
 * Replaces the old split where the heading sat in a 4-of-12 column and the cards
 * were right-aligned in the remaining 8 — that left a dead band down the middle
 * of the page whenever a section returned only a few results.
 *
 * Grid/label styles live in ../utils/sectionLayout so this module stays
 * component-only and Fast Refresh can hot-update it.
 */

const TITLE = {
  fontFamily: "Inter",
  fontSize: "18px",
  fontWeight: 600,
  lineHeight: "28px",
  color: "var(--gray-900, #101828)",
  margin: 0,
};

const SUBTITLE = {
  fontFamily: "Inter",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: "var(--gray-600, #475467)",
  margin: 0,
};

const SearchSection = ({ title, subtitle, children }) => (
  <div
    style={{
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      textAlign: "left",
    }}
  >
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <p style={TITLE}>{title}</p>
      {subtitle ? <p style={SUBTITLE}>{subtitle}</p> : null}
    </div>
    {children}
  </div>
);

export default SearchSection;

SearchSection.propTypes = {
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  children: PropTypes.node,
};
