import { Card, Tooltip } from "antd";
import PropTypes from "prop-types";
import { Subtitle } from "../../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";

/**
 * The event's consumer devices, as two bars that each answer one question
 * (counts from `utils/eventDeviceSummary.js`):
 *
 *   Status    — where they are: checked out, or back on site.
 *   Condition — what state they are in: operational, needs repair, lost.
 *
 * Lost units sit only in Condition: they are neither out with anyone nor on
 * site, so Status says how many it leaves out.
 */
const STATUS_SEGMENTS = [
  { key: "checkedOut", label: "Checked out", color: "var(--text-brand)" },
  { key: "onSite", label: "On site", color: "var(--gray-300)" },
];

const CONDITION_SEGMENTS = [
  { key: "operational", label: "Operational", color: "var(--success-500)" },
  { key: "needsRepair", label: "Needs repair", color: "var(--warning-500)", issue: true },
  { key: "lost", label: "Lost", color: "var(--error-500)", issue: true },
];

const SegmentedBar = ({ title, headline, segments, counts, onOpenIssuesList, footnote }) => {
  const clickable = (segment) =>
    segment.issue && counts[segment.key] > 0 && typeof onOpenIssuesList === "function";

  return (
    <section style={{ flex: "1 1 320px", minWidth: 0 }}>
      <p style={{ ...TextFontsize18LineHeight28, fontWeight: 600 }}>{title}</p>
      <p style={{ ...TextFontSize30LineHeight38, fontWeight: 700, margin: "4px 0 16px" }}>
        {headline}
      </p>

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
        {counts.total > 0 &&
          segments.map((segment) =>
            counts[segment.key] > 0 ? (
              <Tooltip key={segment.key} title={`${segment.label}: ${counts[segment.key]}`}>
                <div
                  style={{
                    width: `${(counts[segment.key] / counts.total) * 100}%`,
                    background: segment.color,
                    cursor: clickable(segment) ? "pointer" : "default",
                  }}
                  onClick={clickable(segment) ? onOpenIssuesList : undefined}
                />
              </Tooltip>
            ) : null
          )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "12px" }}>
        {segments.map((segment) => {
          const canOpen = clickable(segment);
          const emphasize = segment.issue && counts[segment.key] > 0;
          return (
            <button
              key={segment.key}
              onClick={canOpen ? onOpenIssuesList : undefined}
              disabled={!canOpen}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: canOpen ? "pointer" : "default",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: segment.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  ...Subtitle,
                  fontWeight: emphasize ? 700 : 500,
                  color: emphasize ? segment.color : "var(--gray-600, #475467)",
                }}
              >
                {segment.label} · {counts[segment.key]}
                {canOpen ? " →" : ""}
              </span>
            </button>
          );
        })}
      </div>

      {footnote && (
        <p style={{ ...Subtitle, marginTop: "8px", color: "var(--gray-500, #667085)" }}>
          {footnote}
        </p>
      )}
    </section>
  );
};

SegmentedBar.propTypes = {
  title: PropTypes.string.isRequired,
  headline: PropTypes.string.isRequired,
  segments: PropTypes.array.isRequired,
  counts: PropTypes.object.isRequired,
  onOpenIssuesList: PropTypes.func,
  footnote: PropTypes.string,
};

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

const DeviceHealthBar = ({ summary, onOpenIssuesList }) => {
  const { location, condition } = summary;
  const hasIssues = condition.needsRepair + condition.lost > 0;

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
      <p style={{ ...Subtitle, color: "var(--gray-600, #475467)", marginBottom: "12px" }}>
        {plural(condition.total, "consumer device")} in event
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "32px" }}>
        <SegmentedBar
          title="Status"
          headline={`${location.checkedOut} of ${location.total} checked out`}
          segments={STATUS_SEGMENTS}
          counts={location}
          footnote={
            location.lostExcluded > 0
              ? `${plural(location.lostExcluded, "lost device")} not counted here — see Condition.`
              : undefined
          }
        />
        <SegmentedBar
          title="Condition"
          headline={`${condition.operational} of ${condition.total} operational`}
          segments={CONDITION_SEGMENTS}
          counts={condition}
          onOpenIssuesList={onOpenIssuesList}
          footnote={
            !hasIssues && condition.total > 0
              ? "No lost or non-functional devices reported."
              : undefined
          }
        />
      </div>
    </Card>
  );
};

const countsShape = PropTypes.objectOf(PropTypes.number);

DeviceHealthBar.propTypes = {
  summary: PropTypes.shape({
    location: countsShape.isRequired,
    condition: countsShape.isRequired,
  }).isRequired,
  onOpenIssuesList: PropTypes.func,
};

export default DeviceHealthBar;
