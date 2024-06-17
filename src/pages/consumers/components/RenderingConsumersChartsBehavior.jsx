import ReactECharts from "echarts-for-react";
import { PropTypes } from "prop-types";

const RenderingConsumersChartsBehavior = ({ active, inactive }) => {
  const option = {
    color: ["#00359E", "#528BFF"], // Add your custom colors here
    tooltip: {
      trigger: "item",
    },
    legend: {
      top: "5%",
      right: 0,
      orient: "vertical",
    },
    series: [
      {
        name: "Consumer status",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 30,
            fontWeight: "bold",
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          { value: active.number, name: active.title },
          { value: inactive.number, name: inactive.title },
        ],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 400, width: "45%" }} />;
};

RenderingConsumersChartsBehavior.propTypes = {
  active: PropTypes.shape({
    number: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
  inactive: PropTypes.shape({
    number: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
};

export default RenderingConsumersChartsBehavior;
