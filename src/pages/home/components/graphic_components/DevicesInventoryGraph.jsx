import {
  Legend,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import "./DevicesInventoryGraph.css";

const COLORS = ["#155EEF", "#00359E", "#84ADFF", "#fb6b6b"];

const ChartLegendContent = ({ payload }) => {
  return (
    <div className="chart-legend">
      {payload.map((entry, index) => (
        <div key={`item-${index}`} className="chart-legend-item">
          <div
            className="legend-color-indicator"
            style={{ backgroundColor: entry.fill || entry.color }}
          />
          <span className="legend-label">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const CustomTooltipContent = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{payload[0].payload?.name ?? payload[0].name}</p>
        <p className="tooltip-value">{`Value: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const DevicesInventoryGraph = ({ dataToRender, total }) => {
  if (!dataToRender || dataToRender.length === 0) {
    return <div>No data to display</div>;
  }

  const chartData = dataToRender.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }));

  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadialBarChart
        data={chartData}
        innerRadius={84}
        outerRadius={140}
        startAngle={90}
        endAngle={360 + 90}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <PolarAngleAxis tick={false} domain={[0, maxValue]} type="number" reversed />
        <Legend
          verticalAlign="bottom"
          align="center"
          layout="horizontal"
          content={<ChartLegendContent />}
        />
        <Tooltip content={<CustomTooltipContent />} />
        <RadialBar
          isAnimationActive={false}
          dataKey="value"
          nameKey="name"
          cornerRadius={6}
          background={{ fill: "#f4f4f5" }}
        />
        <text x="50%" y="44%" textAnchor="middle" dominantBaseline="middle">
          <tspan
            x="50%"
            dy="-0.6em"
            style={{ fontSize: "12px", fill: "#667085", fontWeight: 500 }}
          >
            Total devices
          </tspan>
          <tspan
            x="50%"
            dy="1.5em"
            style={{ fontSize: "24px", fill: "#101828", fontWeight: 600 }}
          >
            {total ?? 0}
          </tspan>
        </text>
      </RadialBarChart>
    </ResponsiveContainer>
  );
};

export default DevicesInventoryGraph;
