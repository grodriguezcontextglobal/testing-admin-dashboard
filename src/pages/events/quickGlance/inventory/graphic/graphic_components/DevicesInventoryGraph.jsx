import {
  Legend,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import PropTypes from "prop-types";

const COLORS = ["#00359E", "#155EEF", "#84ADFF", "#fb6b6b"];

const TooltipContent = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
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
      <p style={{ margin: 0, fontSize: "12px", fontWeight: 500, color: item.fill }}>
        {item.payload?.name ?? item.name}
      </p>
      <p style={{ margin: "2px 0 0", fontSize: "14px", fontWeight: 600, color: "#101828" }}>
        {item.value}
      </p>
    </div>
  );
};

TooltipContent.propTypes = { active: PropTypes.bool, payload: PropTypes.array };

const LegendContent = ({ payload }) => (
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

LegendContent.propTypes = { payload: PropTypes.array };

const DevicesInventoryGraph = ({ dataToRender, totalDeviceInRange }) => {
  const maxValue = totalDeviceInRange || 1;

  const chartData = dataToRender.map((item, i) => ({
    ...item,
    value: Array.isArray(item.value)
      ? item.value.reduce((a, b) => a + b, 0)
      : (item.value ?? 0),
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadialBarChart
        data={chartData}
        innerRadius={52}
        outerRadius={86}
        startAngle={90}
        endAngle={90 + 360}
        margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
      >
        <PolarAngleAxis
          tick={false}
          domain={[0, maxValue]}
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

        <Tooltip content={<TooltipContent />} />

        <Legend
          verticalAlign="bottom"
          align="center"
          layout="horizontal"
          content={<LegendContent />}
        />

        <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle">
          <tspan
            x="50%"
            dy="-0.5em"
            style={{
              fontFamily: "Inter",
              fontSize: "11px",
              fontWeight: 500,
              fill: "#475467",
            }}
          >
            Total
          </tspan>
          <tspan
            x="50%"
            dy="1.4em"
            style={{
              fontFamily: "Inter",
              fontSize: "20px",
              fontWeight: 600,
              fill: "#101828",
            }}
          >
            {totalDeviceInRange}
          </tspan>
        </text>
      </RadialBarChart>
    </ResponsiveContainer>
  );
};

DevicesInventoryGraph.propTypes = {
  dataToRender: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.array]).isRequired,
    })
  ).isRequired,
  totalDeviceInRange: PropTypes.number.isRequired,
};

export default DevicesInventoryGraph;
