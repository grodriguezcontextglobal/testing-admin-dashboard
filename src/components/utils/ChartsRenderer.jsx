import { PropTypes } from "prop-types";
import ReactECharts from "echarts-for-react";
import { Subtitle } from "../../styles/global/Subtitle";

const ChartsRenderer = ({
  dataToRender,
  title,
  orient,
  top,
  right,
  showLabel,
  legendAlign,
  colors,
  radiusProps,
}) => {
  const radiusP = radiusProps ?? ["40%", "60%"];
  const option = {
    color: colors, // Add your custom colors here
    tooltip: {
      trigger: "item",
    },
    legend: {
      top: top,
      right: right,
      orient: orient,
      align: legendAlign,
      textStyle: { Subtitle },
    },
    series: [
      {
        name: title,
        type: "pie",
        radius: radiusP,
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: showLabel,
            fontSize: 14,
            fontWeight: "500",
          },
        },
        labelLine: {
          show: false,
        },
        data: [...dataToRender],
      },
    ],
  };

  return <ReactECharts option={option} style={{ width: "100%" }} />;
};

ChartsRenderer.propTypes = {
  dataToRender: PropTypes.array,
  title: PropTypes.string,
};

export default ChartsRenderer;
