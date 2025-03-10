/* eslint-disable no-unused-vars */
import { Card } from "antd";
import ReactECharts from "echarts-for-react";
import { PropTypes } from "prop-types";
import getBarChartData from "../utils/getBarChartData";

const BarAnimation = ({ dataToRender, title }) => {
  const { xAxisData, series } = getBarChartData(dataToRender);

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    // 1. Legend configuration
    legend: {
      type: "scroll", // allows horizontal scrolling if there are many items
      orient: "horizontal", // horizontal layout
      top: 0, // place at the top of the chart
      left: "center", // center horizontally
      // right: "5%",       // optionally add spacing on the right if needed
      itemGap: 10,       // spacing between legend items
      textStyle: {       // optionally adjust text style
        fontSize: 12
      },
      data: series.map((s) => s.name),
    },
    // 2. Adjust the chart’s grid to make room for the legend
    grid: {
      top: 60, // extra space at the top for the legend
      left: "10%",
      right: "10%",
      bottom: 40,
      containLabel: false,
    },
    toolbox: {
      show: true,
      orient: "vertical",
      left: "right",
      top: "center",
      feature: {
        mark: { show: true },
        dataView: { show: true, readOnly: false },
        magicType: { show: true, type: ["line", "bar", "stack"] },
        restore: { show: true },
        saveAsImage: { show: true },
      },
    },
    xAxis: [
      {
        type: "category",
        axisTick: { show: false },
        data: xAxisData, // location names
      },
    ],
    yAxis: [
      {
        type: "value",
      },
    ],
    series, // your array of bar series
  };

  return (
    <Card
      title={title}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        alignSelf: "stretch",
        borderRadius: "8px",
        border: "1px solid var(--Gray-300, #D0D5DD)",
        background: "var(--Gray-100, #F2F4F7)",
        width: "100%",
      }}
      styles={{
        body: {
          height: "20rem",
          width: "100%",
        },
      }}
    >
      <ReactECharts option={option} />
    </Card>
  );
};

BarAnimation.propTypes = {
  dataToRender: PropTypes.array.isRequired,
  title: PropTypes.string,
};

export default BarAnimation;
