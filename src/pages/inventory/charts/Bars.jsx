import { Card } from "antd";
import ReactECharts from "echarts-for-react";
import { PropTypes } from "prop-types";

const Bars = ({ dataToRender, title }) => {
  const formattingData = dataToRender.map((item) => {
    return [item[0], item[1]];
  });

  const gettingMinAndMax = () => {
    const result = [];
    dataToRender.forEach(element => {
        result.push(element[0]);
    });
    return Math.max(...result)
  };

  const option = {
    legend: {},
    tooltip: {},
    dataset: {
      source: [["amount", "item"], ...formattingData],
    },
    grid: [{ bottom: '20%' }, { top: '55%' }],
    // grid: { containLabel: true },
    xAxis: { name: "Qty" },
    yAxis: { type: "category" },
    visualMap: {
      orient: "horizontal",
      left: "center",
      min: 0,
      max: gettingMinAndMax(),
      text: ["High Score", "Low Score"],
      // Map the score column to color
      dimension: 0,
      inRange: {
        color: ["#FD665F", "#FFCE34", "#65B581"],
      },
    },
    series: [
      {
        type: "bar",
        encode: {
          // Map the "amount" column to X axis.
          x: "amount",
          // Map the "product" column to Y axis
          y: "item",
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
        padding: '0 15px',
        height: '80%',
        width: '95%',
        margin: 'auto',
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
