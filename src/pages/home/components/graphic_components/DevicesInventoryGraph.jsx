import ReactECharts from "echarts-for-react";
import PropTypes from "prop-types";

/**
 * Devices-inventory donut, Untitled UI style: compact centered donut with the
 * total in the middle and an HTML legend (name · count) beside it.
 * Same props as the old recharts radial chart: dataToRender [{name, value}],
 * total.
 */
const COLORS = [
  "var(--action-600, #155eef)",
  "var(--brand-600, #021833)",
  "var(--brand-400, #677485)",
  "var(--error-500, #d15334)",
];
// echarts paints inside svg — needs resolved colors, not CSS vars
const CHART_COLORS = ["#155eef", "#021833", "#677485", "#d15334"];

const DevicesInventoryGraph = ({ dataToRender, total }) => {
  if (!dataToRender || dataToRender.length === 0) {
    return null;
  }

  const option = {
    tooltip: {
      trigger: "item",
      backgroundColor: "#171d1a",
      borderWidth: 0,
      borderRadius: 8,
      textStyle: { color: "#fff", fontFamily: "Inter", fontSize: 12 },
    },
    legend: { show: false },
    series: [
      {
        type: "pie",
        radius: ["70%", "92%"],
        center: ["50%", "50%"],
        label: { show: false },
        labelLine: { show: false },
        itemStyle: { borderColor: "#fff", borderWidth: 2 },
        data: dataToRender.map((d, i) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] },
        })),
      },
    ],
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "24px",
        width: "100%",
        minWidth: 0,
        flexWrap: "wrap",
      }}
    >
      <div
        style={{ position: "relative", width: 160, height: 160, flexShrink: 0 }}
      >
        <ReactECharts
          option={option}
          style={{ width: 160, height: 160 }}
          opts={{ renderer: "svg" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--gray-500, #777b73)",
            }}
          >
            Total
          </span>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "24px",
              lineHeight: "32px",
              fontWeight: 600,
              color: "var(--gray-900, #171d1a)",
            }}
          >
            {total ?? 0}
          </span>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          minWidth: 0,
        }}
      >
        {dataToRender.map((d, i) => (
          <span
            key={d.name}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "var(--gray-600, #5d615a)",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "9999px",
                background: COLORS[i % COLORS.length],
                flexShrink: 0,
              }}
            />
            {d.name}
            <span
              style={{ fontWeight: 600, color: "var(--gray-900, #171d1a)" }}
            >
              {d.value}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

DevicesInventoryGraph.propTypes = {
  dataToRender: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.number,
    })
  ),
  total: PropTypes.number,
};

export default DevicesInventoryGraph;
