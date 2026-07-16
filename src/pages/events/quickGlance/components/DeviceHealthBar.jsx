import { Card, Tooltip } from "antd";
import PropTypes from "prop-types";
import { Subtitle } from "../../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";

/**
 * Unified device-health stat bar for an event.
 * Replaces the three disconnected stat cards + gauge chart with one story:
 * a headline ("12 of 20 devices checked out"), a proportional segmented bar,
 * and a legend with counts. Segments are mutually exclusive and sum to total:
 *   checkedOut — operational and out with a consumer
 *   onHand     — operational, available to assign
 *   needsRepair— returned with a non-functional report (not lost)
 *   lost       — flagged lost
 */
const SEGMENTS = [
  { key: "checkedOut", label: "Checked out", color: "var(--brand-600)" },
  { key: "onHand", label: "On hand", color: "var(--success-500)" },
  { key: "needsRepair", label: "Needs repair", color: "var(--warning-500)" },
  { key: "lost", label: "Lost", color: "var(--error-500)" },
];

const DeviceHealthBar = ({ counts, onOpenIssuesList }) => {
  const total =
    counts.checkedOut + counts.onHand + counts.needsRepair + counts.lost;
  const hasIssues = counts.needsRepair + counts.lost > 0;

  const segmentClickable = (key) =>
    (key === "needsRepair" || key === "lost") &&
    counts[key] > 0 &&
    typeof onOpenIssuesList === "function";

  return (
    <Card
      style={{
        borderRadius: "12px",
        border: "1px solid var(--gray-200, #EAECF0)",
        background: "var(--base-white, #FFF)",
        boxShadow:
          "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
        width: "100%",
      }}
      styles={{ body: { padding: "20px 24px" } }}
    >
      {/* Headline */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <p style={{ ...TextFontsize18LineHeight28, fontWeight: 600 }}>
          Device health
        </p>
        <p style={{ ...Subtitle, color: "var(--gray-600, #475467)" }}>
          {total} consumer device{total === 1 ? "" : "s"} in event
        </p>
      </div>
      <p
        style={{
          ...TextFontSize30LineHeight38,
          fontWeight: 700,
          margin: "4px 0 16px",
        }}
      >
        {counts.checkedOut} of {total} checked out
      </p>

      {/* Segmented bar */}
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "12px",
          borderRadius: "6px",
          overflow: "hidden",
          background: "var(--gray-100, #F2F4F7)",
        }}
      >
        {total > 0 &&
          SEGMENTS.map(({ key, label, color }) =>
            counts[key] > 0 ? (
              <Tooltip key={key} title={`${label}: ${counts[key]}`}>
                <div
                  style={{
                    width: `${(counts[key] / total) * 100}%`,
                    background: color,
                    cursor: segmentClickable(key) ? "pointer" : "default",
                  }}
                  onClick={
                    segmentClickable(key) ? onOpenIssuesList : undefined
                  }
                />
              </Tooltip>
            ) : null
          )}
      </div>

      {/* Legend with counts */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          marginTop: "12px",
        }}
      >
        {SEGMENTS.map(({ key, label, color }) => {
          const clickable = segmentClickable(key);
          const emphasize =
            (key === "lost" || key === "needsRepair") && counts[key] > 0;
          return (
            <button
              key={key}
              onClick={clickable ? onOpenIssuesList : undefined}
              disabled={!clickable}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: clickable ? "pointer" : "default",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  ...Subtitle,
                  fontWeight: emphasize ? 700 : 500,
                  color: emphasize ? color : "var(--gray-600, #475467)",
                }}
              >
                {label} · {counts[key]}
                {clickable ? " →" : ""}
              </span>
            </button>
          );
        })}
      </div>

      {!hasIssues && total > 0 && (
        <p style={{ ...Subtitle, marginTop: "8px", color: "var(--gray-500, #667085)" }}>
          No lost or non-functional devices reported.
        </p>
      )}
    </Card>
  );
};

DeviceHealthBar.propTypes = {
  counts: PropTypes.shape({
    checkedOut: PropTypes.number.isRequired,
    onHand: PropTypes.number.isRequired,
    needsRepair: PropTypes.number.isRequired,
    lost: PropTypes.number.isRequired,
  }).isRequired,
  onOpenIssuesList: PropTypes.func,
};

export default DeviceHealthBar;
