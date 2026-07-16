import { Icon } from "@iconify/react";
import PropTypes from "prop-types";

/**
 * Untitled UI filter bar: segmented filter tabs on the left, search + trailing
 * actions (e.g. date range, "More filters") on the right. Controlled.
 */
const segBtn = (active) => ({
  padding: "8px 14px",
  border: "none",
  borderRight: "1px solid var(--gray-300, #c6c7bb)",
  background: active ? "var(--gray-50, #f7f7f4)" : "var(--base-white, #fff)",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 600,
  color: active ? "var(--gray-800, #313732)" : "var(--gray-600, #5d615a)",
  cursor: "pointer",
  transition: "background 0.12s ease",
  whiteSpace: "nowrap",
});

const FilterBar = ({
  tabs,
  activeTab,
  onTabChange,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  trailing,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      flexWrap: "wrap",
      width: "100%",
    }}
  >
    {/* segmented tabs */}
    <div
      style={{
        display: "inline-flex",
        border: "1px solid var(--gray-300, #c6c7bb)",
        borderRadius: "var(--radius-md, 8px)",
        overflow: "hidden",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      {tabs.map((tab, i) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          style={{
            ...segBtn(tab.key === activeTab),
            borderRight:
              i === tabs.length - 1
                ? "none"
                : "1px solid var(--gray-300, #c6c7bb)",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>

    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      {/* search */}
      {onSearchChange && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "240px",
            padding: "8px 12px",
            border: "1px solid var(--gray-300, #c6c7bb)",
            borderRadius: "var(--radius-md, 8px)",
            background: "var(--base-white, #fff)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <Icon icon="tabler:search" width={18} color="var(--gray-500)" />
          <input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "var(--gray-900, #171d1a)",
              background: "transparent",
            }}
          />
        </div>
      )}
      {trailing}
    </div>
  </div>
);

FilterBar.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.node.isRequired,
    })
  ).isRequired,
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  trailing: PropTypes.node,
};

FilterBar.defaultProps = {
  searchPlaceholder: "Search",
};

export default FilterBar;
