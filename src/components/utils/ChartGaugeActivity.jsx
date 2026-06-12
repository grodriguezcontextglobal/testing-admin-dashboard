import {
  Legend,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import PropTypes from "prop-types";

/**
 * ChartGaugeActivity
 *
 * Reusable radial gauge matching the Untitled UI ActivityGauge pattern.
 *
 * Props:
 *   dataToRender  {Array<{ name, value, fill? }>}  required — chart series
 *   title         {string|number}                  center metric (large, bold)
 *   subtitle      {string}                         center label (small, gray)
 *   maxValue      {number}                         domain ceiling; defaults to max(data.value)
 *   height        {number}                         chart height in px (default 220)
 *   colors        {string[]}                       fallback palette when item.fill is absent
 *   showLegend    {boolean}                        show/hide the bottom legend (default true)
 *   innerRadius   {number}                         default 52
 *   outerRadius   {number}                         default 86
 *   onClick       {() => void}                     optional click handler on the chart wrapper
 */

const DEFAULT_COLORS = [
  "#00359E",
  "#155EEF",
  "#84ADFF",
  "#fb6b6b",
  "#F79009",
  "#12B76A",
];

const GaugeTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  // payload[0].name is the dataKey string ("value"), not the series name.
  // The actual series name is on the original data object via payload[0].payload.
  const label = item.payload?.name ?? item.name;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #EAECF0",
        borderRadius: "8px",
        padding: "8px 12px",
        fontFamily: "Inter",
        boxShadow:
          "0px 4px 6px -2px rgba(16,24,40,0.03),0px 12px 16px -4px rgba(16,24,40,0.08)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "12px",
          fontWeight: 500,
          color: item.fill,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: "2px 0 0",
          fontSize: "14px",
          fontWeight: 600,
          color: "#101828",
        }}
      >
        {item.value}
      </p>
    </div>
  );
};

GaugeTooltip.propTypes = { active: PropTypes.bool, payload: PropTypes.array };

const GaugeLegend = ({ payload }) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: "6px 14px",
      paddingTop: "8px",
    }}
  >
    {payload?.map((entry, i) => (
      <div
        key={i}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          fontFamily: "Inter",
          fontSize: "12px",
          color: "#475467",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: entry.color,
            flexShrink: 0,
          }}
        />
        {entry.value}
      </div>
    ))}
  </div>
);

GaugeLegend.propTypes = { payload: PropTypes.array };

export const ChartGaugeActivity = ({
  dataToRender,
  title,
  subtitle,
  maxValue,
  height = 220,
  colors = DEFAULT_COLORS,
  showLegend = true,
  innerRadius = 52,
  outerRadius = 86,
  onClick,
}) => {
  const chartData = dataToRender.map((item, i) => ({
    ...item,
    value: Array.isArray(item.value)
      ? item.value.reduce((a, b) => a + b, 0)
      : (item.value ?? 0),
    fill: item.fill ?? colors[i % colors.length],
  }));

  const domain =
    maxValue ?? Math.max(...chartData.map((d) => d.value), 1);

  const hasCenterText = title != null || subtitle != null;

  return (
    <div
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default", width: "100%" }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <RadialBarChart
          data={chartData}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={90}
          endAngle={90 + 360}
          margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
        >
          <PolarAngleAxis
            tick={false}
            domain={[0, domain]}
            type="number"
            reversed
          />

          <RadialBar
            isAnimationActive={false}
            dataKey="value"
            nameKey="name"
            cornerRadius={99}
            background={{ fill: "#F2F4F7" }}
          />

          <Tooltip content={<GaugeTooltip />} />

          {showLegend && (
            <Legend
              verticalAlign="bottom"
              align="center"
              layout="horizontal"
              content={<GaugeLegend />}
            />
          )}

          {hasCenterText && (
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {subtitle != null && (
                <tspan
                  x="50%"
                  dy={title != null ? "-1.175em" : "1%"}
                  style={{
                    fontFamily: "Inter",
                    fontSize: "12px",
                    fontWeight: 500,
                    fill: "#475467",
                  }}
                >
                  {subtitle}
                </tspan>
              )}
              {title != null && (
                <tspan
                  x="50%"
                  dy={subtitle != null ? "1.25em" : "1%"}
                  style={{
                    fontFamily: "Inter",
                    fontSize: "20px",
                    fontWeight: 600,
                    fill: "#101828",
                  }}
                >
                  {title}
                </tspan>
              )}
            </text>
          )}
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
};

ChartGaugeActivity.propTypes = {
  dataToRender: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.array]).isRequired,
      fill: PropTypes.string,
    })
  ).isRequired,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  subtitle: PropTypes.string,
  maxValue: PropTypes.number,
  height: PropTypes.number,
  colors: PropTypes.arrayOf(PropTypes.string),
  showLegend: PropTypes.bool,
  innerRadius: PropTypes.number,
  outerRadius: PropTypes.number,
  onClick: PropTypes.func,
};

export default ChartGaugeActivity;
