import ReactECharts from "echarts-for-react";
import { PropTypes } from "prop-types";
import { Subtitle } from "../../styles/global/Subtitle";
import { useLocation } from "react-router-dom";

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
  onClick, // Add an onClick prop for custom click handling
}) => {
  const location = useLocation();
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

  // Handle click event
  const onChartClick = (params) => {
    // If you passed an onClick prop, call it with the clicked data
    if (location.pathname === "/")
      if (onClick) {
        onClick(params.name);
      }
  };

  return (
    <>
      <ReactECharts
        option={option}
        style={{ width: "100%" }}
        onEvents={{
          click: onChartClick, // Attach click event handler
        }}
      />
    </>
  );
};

ChartsRenderer.propTypes = {
  dataToRender: PropTypes.array,
  title: PropTypes.string,
  onClick: PropTypes.func, // Add a prop type for onClick
};

export default ChartsRenderer;
