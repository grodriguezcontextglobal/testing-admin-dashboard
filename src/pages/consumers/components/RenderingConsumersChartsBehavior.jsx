import { Card } from "antd";
import ReactECharts from "echarts-for-react";
import { PropTypes } from "prop-types";
import { Subtitle } from "../../../styles/global/Subtitle";

const RenderingConsumersChartsBehavior = ({ active, inactive, props }) => {
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

  return (
    <Card
      title={props.title}
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
        },
      }}
      style={{ backgroundColor: "#fff", width: "25vw", height: "auto" }}
    >
      <ReactECharts option={option} style={{ height: '300px', width: '24vw' }} />
      <p
        style={{
          ...Subtitle,
          width: "100%",
          textAlign: "right",
          textWrap: "balance",
        }}
      >
        {props.description}
      </p>
      <p
        style={{
          ...Subtitle,
          width: "100%",
          fontSize: "16px",
          lineHeight: "20px",
          textAlign: "right",
          textWrap: "balance",
          margin: "20px 0 0 0",
        }}
      >
        Total: {props.total}
      </p>
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
};

export default RenderingConsumersChartsBehavior;
