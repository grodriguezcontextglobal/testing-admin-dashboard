import { Card } from "antd";
import ReactECharts from "echarts-for-react";
import { PropTypes } from "prop-types";

const Bars = ({ dataToRender, title }) => {
  const labelOption = {
    show: true,
    position: "insideBottom",
    distance: 15,
    align: "left",
    verticalAlign: "middle",
    rotate: 80,
    formatter: "{c}  {name|{a}}",
    fontSize: 16,
    fontFamily:"Inter",
    color:"#000",
    rich: {
      name: {},
    },
  };

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    legend: {
      type: "scroll",
      orient: "horizontal",
      top: 0,
      left: "center",
      itemGap: 10,
      textStyle: {
        fontSize: 12,
      },
      data: [...dataToRender.map((item) => item.group)],
    },
    grid: {
      top: 60,
      left: "10%",
      right: "10%",
      bottom: 40,
      containLabel: true,
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
        data: [...dataToRender.map((item) => item.group)],
      },
    ],
    yAxis: [
      {
        type: "value",
      },
    ],
    series: [
      {
        name: "Available",
        type: "bar",
        barGap: 0.1,
        label: labelOption,
        showBackground: true,
        emphasis: {
          focus: "series",
        },
        data: [...dataToRender.map((item) => Number(item.available))],
        itemStyle: {
          color: "rgba(69, 104, 220, 1)", // Set Available items to blue
          backgroundColor: "rgba(69, 104, 220, 1)",
        },
      },
      {
        name: "Not Available",
        type: "bar",
        barGap: 0.1,
        label: labelOption,
        showBackground: true,
        emphasis: {
          focus: "series",
        },
        data: [...dataToRender.map((item) => Number(item.notAvailable))],
        itemStyle: {
          color: "rgba(192, 43, 10, 1)", // Set Not Available items to red
          backgroundColor: "rgba(192, 43, 10, 1)",
        },
      },
    ],
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
          padding: "0 15px",
          height: "80%",
          width: "90%",
          margin: "auto",
        },
      }}
    >
      <ReactECharts option={option} />
    </Card>
  );
};
export default Bars;

Bars.propTypes = {
  dataToRender: PropTypes.array,
};
