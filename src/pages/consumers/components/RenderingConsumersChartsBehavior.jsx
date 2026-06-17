import { Card } from "antd";
import ReactECharts from "echarts-for-react";
import { PropTypes } from "prop-types";
import { Subtitle } from "../../../styles/global/Subtitle";
import { useMediaQuery } from "@uidotdev/usehooks";

const RenderingConsumersChartsBehavior = ({ active, inactive, props, compact = false }) => {
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 993px) and (max-width : 1200px)"
  );
  const isExtraLargeDevice = useMediaQuery(
    "only screen and (min-width : 1201px)"
  );
  const option = {
    color: ["var(--blue-dark-700, #00359E)", "var(--primary-300, #9B8AFB)"],
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

  const chartSize = compact
    ? "180px"
    : isLargeDevice || isExtraLargeDevice
    ? "350px"
    : "250px";

  return (
    <Card
      title={compact ? null : props.title}
      styles={{
        header: {
          backgroundColor: "#fff",
          borderBottom: "none",
          width: "100%",
          textAlign: "left",
          padding: "0 0 0 30px",
        },
        body: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: compact ? "12px" : undefined,
        },
      }}
      style={{ backgroundColor: "#fff", width: "100%", height: "auto" }}
    >
      <ReactECharts
        option={option}
        style={{ height: chartSize, width: chartSize }}
      />
      {!compact && (
        <p
          style={{
            ...Subtitle,
            width: "100%",
            textAlign: "left",
            textWrap: "balance",
          }}
        >
          {props.description}
        </p>
      )}
    </Card>
  );
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
  compact: PropTypes.bool,
};

export default RenderingConsumersChartsBehavior;
