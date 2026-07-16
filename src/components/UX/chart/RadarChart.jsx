import ReactECharts from "echarts-for-react";
import PropTypes from "prop-types";

/**
 * Untitled UI radar chart (echarts): khaki-gray grid, Inter labels, series in
 * the brand blue family with soft fills.
 *
 * indicators: [{ name, max }]
 * series: [{ name, values: number[], color? }]
 */
const DEFAULT_COLORS = ["#155eef", "#35465c", "#d15334"];

const RadarChart = ({ indicators, series, height }) => {
  const option = {
    color: DEFAULT_COLORS,
    tooltip: {
      trigger: "item",
      backgroundColor: "#171d1a",
      borderWidth: 0,
      borderRadius: 8,
      textStyle: { color: "#fff", fontFamily: "Inter", fontSize: 12 },
    },
    legend: {
      bottom: 0,
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
      textStyle: {
        fontFamily: "Inter",
        fontSize: 12,
        color: "#5d615a",
      },
    },
    radar: {
      indicator: indicators,
      radius: "65%",
      splitNumber: 4,
      axisName: {
        fontFamily: "Inter",
        fontSize: 12,
        fontWeight: 500,
        color: "#5d615a",
      },
      splitLine: { lineStyle: { color: "#ddded6" } },
      splitArea: {
        areaStyle: { color: ["#ffffff", "#fbfbfa"] },
      },
      axisLine: { lineStyle: { color: "#ddded6" } },
    },
    series: [
      {
        type: "radar",
        symbol: "circle",
        symbolSize: 5,
        data: series.map((s, i) => ({
          name: s.name,
          value: s.values,
          lineStyle: { width: 2, color: s.color || DEFAULT_COLORS[i % 3] },
          itemStyle: { color: s.color || DEFAULT_COLORS[i % 3] },
          areaStyle: {
            color: s.color || DEFAULT_COLORS[i % 3],
            opacity: 0.12,
          },
        })),
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ width: "100%", height }}
      opts={{ renderer: "svg" }}
    />
  );
};

RadarChart.propTypes = {
  indicators: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      max: PropTypes.number.isRequired,
    })
  ).isRequired,
  series: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      values: PropTypes.arrayOf(PropTypes.number).isRequired,
      color: PropTypes.string,
    })
  ).isRequired,
  height: PropTypes.number,
};

RadarChart.defaultProps = {
  height: 360,
};

export default RadarChart;
