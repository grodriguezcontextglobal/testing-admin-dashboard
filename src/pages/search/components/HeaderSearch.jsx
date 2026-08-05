import { Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { PropTypes } from "prop-types";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import { Subtitle } from "../../../styles/global/Subtitle";

/**
 * Search-results header: title + result count on the left, Untitled segmented
 * filter tabs on the right. Filters are multi-selectable; "View All" clears.
 * `initialFilters` lets the command menu's scoped search preselect a tab.
 */
const railStyle = {
  display: "inline-flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "4px",
  border: "1px solid var(--gray-200, #ddded6)",
  borderRadius: "var(--radius-md, 8px)",
  padding: "4px",
  backgroundColor: "var(--gray-50, #f7f7f4)",
  width: "fit-content",
};

const tabStyle = (active) => ({
  border: "none",
  outline: "none",
  background: active ? "var(--base-white, #fff)" : "transparent",
  borderRadius: "var(--radius-sm, 6px)",
  padding: "8px 12px",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  lineHeight: "20px",
  fontWeight: 600,
  color: active ? "var(--gray-700, #484d47)" : "var(--gray-500, #777b73)",
  boxShadow: active ? "var(--shadow-sm)" : "none",
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: "background 0.12s ease, color 0.12s ease, box-shadow 0.12s ease",
});

// `key` drives the filter state; `label` is what the tab renders, so a district
// can show "Students" over the Members bucket. Callers pass an industry-aware
// list — see SearchMainPage.
const DEFAULT_OPTIONS = [
  { key: "View All", label: "View All" },
  { key: "Consumers", label: "Consumers" },
  { key: "Staff", label: "Staff" },
  { key: "Inventory", label: "Inventory" },
  { key: "Members", label: "Members" },
  { key: "Devices", label: "Devices" },
  { key: "Events", label: "Events" },
];

const HeaderSearch = ({
  countingResults,
  setFilterOptions,
  initialFilters,
  options = DEFAULT_OPTIONS,
}) => {
  const [activedParams, setActivedParams] = useState(
    Array.isArray(initialFilters) ? initialFilters.filter(Boolean) : []
  );

  const handleActiveParams = (item) => {
    if (item === "View All") {
      return setActivedParams([]);
    }
    if (activedParams.some((element) => element === item)) {
      return setActivedParams(activedParams.filter((el) => el !== item));
    }
    return setActivedParams([...activedParams, item]);
  };

  useMemo(() => {
    const ref = { Posts: 0 };
    for (let option of options) {
      ref[option.key] = 0;
    }
    ref["View All"] = activedParams.length < 1 ? 1 : 0;
    for (let data of activedParams) {
      ref[data] = 1;
    }
    return setFilterOptions(ref);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activedParams, options]);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        padding: "20px 24px",
        gap: "20px",
        alignSelf: "stretch",
        backgroundColor: "var(--base-white, #fff)",
      }}
    >
      <div style={{ textAlign: "left" }}>
        <Typography style={{ ...TextFontsize18LineHeight28, width: "100%" }}>
          Search results
        </Typography>
        <Typography style={{ ...Subtitle, width: "100%" }}>
          There {countingResults() === 1 ? "is" : "are"} {countingResults()}{" "}
          {countingResults() === 1 ? "result" : "results"} to your query
        </Typography>
      </div>
      <div style={railStyle}>
        {options.map((item) => {
          const active =
            item.key === "View All"
              ? activedParams.length === 0
              : activedParams.some((element) => element === item.key);
          return (
            <button
              key={item.key}
              style={tabStyle(active)}
              onClick={() => handleActiveParams(item.key)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HeaderSearch;
HeaderSearch.propTypes = {
  countingResults: PropTypes.func,
  setFilterOptions: PropTypes.func,
  initialFilters: PropTypes.array,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
};
