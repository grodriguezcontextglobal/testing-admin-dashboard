import { Card } from "antd";
import ReactECharts from "echarts-for-react";
import { PropTypes } from "prop-types";

const Pie = ({ dataToRender, title }) => {
  const formattingData = dataToRender.map((item) => ({
    value: item[0],
    name: item[1],
  }));
  
  const option = {
    tooltip: {
      trigger: "item",
    },
    legend: {
      top: "1%",
      left: "center",
    },
    series: [
      {
        name: {title},
        type: "pie",
        radius: ["50%", "70%"],
        avoidLabelOverlap: false,
        padAngle: 0,
        itemStyle: {
          borderRadius: 10,
        },
        label: {
          show: true,
          position: "center",
        },
        emphasis: {
          label: {
            show: false,
            fontSize: 30,
            fontWeight: "bold",
          },
        },
        labelLine: {
          show: true,
        },
        data: formattingData,
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
        width: "45%",
      }}
      styles={{
        body: {
          padding: "0 15px",
          height: "80%",
          width: "100%",
          margin: "auto",
        },
      }}
    >
      <ReactECharts
        option={option}
        notMerge={true}
      />
    </Card>
  );
};
export default Pie;

Pie.propTypes = {
  dataToRender: PropTypes.array,
};
