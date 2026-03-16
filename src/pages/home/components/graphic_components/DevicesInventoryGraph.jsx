import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import "./DevicesInventoryGraph.css";

const COLORS = ["#00359E", "#155EEF", "#84ADFF", "#fb6b6b"];

const ChartLegendContent = ({ payload }) => {
  return (
    <div className="chart-legend">
      {payload.map((entry, index) => (
        <div key={`item-${index}`} className="chart-legend-item">
          <div
            className="legend-color-indicator"
            style={{ backgroundColor: entry.color }}
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
        <p className="tooltip-label">{`${payload[0].name}`}</p>
        <p className="tooltip-value">{`Value: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const DevicesInventoryGraph = ({ dataToRender }) => {
  if (!dataToRender || dataToRender.length === 0) {
    return <div>No data to display</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <Legend
          verticalAlign="top"
          align="right"
          layout="vertical"
          content={<ChartLegendContent />}
        />
        <Tooltip content={<CustomTooltipContent />} />
        <Pie
          data={dataToRender}
          cx="50%"
          cy="50%"
          dataKey="value"
          nameKey="name"
          innerRadius={70}
          outerRadius={140}
          startAngle={90}
          endAngle={-270}
          stroke="none"
          isAnimationActive={false}
        >
          {dataToRender.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};
export default DevicesInventoryGraph;
