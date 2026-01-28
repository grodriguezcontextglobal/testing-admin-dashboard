import ReactECharts from "echarts-for-react";
import { PropTypes } from "prop-types";
import { Subtitle } from "../../styles/global/Subtitle";
import { useLocation } from "react-router-dom";
import { useRef, useEffect, useState } from "react";

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
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({
    width: "100%",
    height: "100%",
  });
  const radiusP = radiusProps ?? ["40%", "60%"];

  useEffect(() => {
    const observeTarget = containerRef.current;
    if (!observeTarget) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });
    resizeObserver.observe(observeTarget);
    return () => {
      resizeObserver.unobserve(observeTarget);
    };
  }, []);

  const option = {
    color: colors,
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
    // Add responsive configuration
    grid: {
      left: "0%",
      right: "0%",
      bottom: "0%",
      top: "0%",
      containLabel: true,
    },
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
    <div ref={containerRef} style={{ width: "15rem", height: "25rem" }}>
      <ReactECharts
        option={option}
        style={{ width: "100%", height: dimensions.height }}
        onEvents={{
          click: onChartClick, // Attach click event handler
        }}
        opts={{ renderer: "canvas" }}
      />
    </div>
  );
};

ChartsRenderer.propTypes = {
  dataToRender: PropTypes.array,
  title: PropTypes.string,
  onClick: PropTypes.func, // Add a prop type for onClick
};

export default ChartsRenderer;
