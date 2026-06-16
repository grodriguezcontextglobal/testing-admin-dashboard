import { Card } from "antd";
import PropTypes from "prop-types";

const SIZE = 160;
const STROKE = 18;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const CX = SIZE / 2;
const CY = SIZE / 2;
const VIEWBOX = `0 0 ${SIZE} ${SIZE}`;

const cardTokens = {
  borderRadius: "12px",
  border: "1px solid var(--gray-200, #EAECF0)",
  background: "var(--base-white, #FFF)",
  boxShadow:
    "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
  width: "100%",
};

const LegendItem = ({ color, label, value }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: "2px",
    }}
  >
    <div
      style={{ display: "flex", alignItems: "center", gap: "6px" }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
          display: "inline-block",
        }}
      />
      <span
        style={{
          fontFamily: "Inter",
          fontSize: "12px",
          lineHeight: "18px",
          color: "var(--gray-500, #667085)",
        }}
      >
        {label}
      </span>
    </div>
    <span
      style={{
        fontFamily: "Inter",
        fontSize: "20px",
        fontWeight: 600,
        lineHeight: "30px",
        color: "var(--gray-900, #101828)",
        paddingLeft: "14px",
      }}
    >
      {value}
    </span>
  </div>
);

const ActivityGauge = ({ active = 0, inactive = 0, total = 0 }) => {
  const activeRatio = total > 0 ? active / total : 0;
  const activeDash = C * activeRatio;

  return (
    <Card
      data-testid="activity-gauge"
      style={cardTokens}
      styles={{ body: { padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" } }}
    >
      {/* Ring */}
      <div style={{ position: "relative", width: "100%", maxWidth: SIZE }}>
        <svg
          viewBox={VIEWBOX}
          width="100%"
          style={{ transform: "rotate(-90deg)", display: "block" }}
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="var(--gray-100, #F2F4F7)"
            strokeWidth={STROKE}
          />
          {/* Active arc */}
          {activeDash > 0 && (
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke="var(--success-600, #039855)"
              strokeWidth={STROKE}
              strokeDasharray={`${activeDash} ${C - activeDash}`}
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Center label — overlay sobre el SVG responsivo */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2px",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontFamily: "Inter",
              fontSize: "30px",
              fontWeight: 700,
              lineHeight: "38px",
              color: "var(--gray-900, #101828)",
            }}
          >
            {total}
          </span>
          <span
            style={{
              fontFamily: "Inter",
              fontSize: "12px",
              lineHeight: "18px",
              color: "var(--gray-500, #667085)",
            }}
          >
            Total
          </span>
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          justifyContent: "center",
          flexWrap: "wrap",
          width: "100%",
        }}
      >
        <LegendItem
          color="var(--success-600, #039855)"
          label="Active"
          value={active}
        />
        <LegendItem
          color="var(--gray-300, #D0D5DD)"
          label="Inactive"
          value={inactive}
        />
      </div>
    </Card>
  );
};

ActivityGauge.propTypes = {
  active: PropTypes.number,
  inactive: PropTypes.number,
  total: PropTypes.number,
};

LegendItem.propTypes = {
  color: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
};

export default ActivityGauge;
