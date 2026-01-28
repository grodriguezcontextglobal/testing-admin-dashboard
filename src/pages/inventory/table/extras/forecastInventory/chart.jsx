import ReactECharts from "echarts-for-react";
import { useMemo } from "react";

// Daily Analysis Chart Component
export const DailyAnalysisChart = ({ dailyData }) => {
  const chartData = useMemo(() => {
    if (!dailyData || dailyData.length === 0) return null;

    // Extract dates and sort them
    const sortedDates = dailyData.map((item) => item.date).sort();

    // Prepare series data for each metric
    const colors = [
      "#4568DC", // Total Inventory - Blue
      "#43A047", // Total Available - Green
      "#FF7043", // Total Demand - Orange
    ];

    const series = [
      {
        name: "Total Inventory",
        type: "bar",
        data: dailyData.map((item) => item.total_inventory || 0),
        itemStyle: { color: colors[0] },
        emphasis: {
          focus: "series",
        },
      },
      {
        name: "Total Available",
        type: "bar",
        data: dailyData.map((item) => item.total_available || 0),
        itemStyle: { color: colors[1] },
        emphasis: {
          focus: "series",
        },
      },
      {
        name: "Total Demand",
        type: "line",
        data: dailyData.map((item) => item.total_demand || 0),
        itemStyle: { color: colors[2] },
        lineStyle: { color: colors[2], width: 3 },
        symbol: "circle",
        symbolSize: 6,
        emphasis: {
          focus: "series",
        },
      },
    ];

    return {
      dates: sortedDates,
      series: series,
    };
  }, [dailyData]);

  if (!chartData) return null;

  const option = {
    title: {
      text: "",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        crossStyle: {
          color: "#999",
        },
      },
      formatter: function (params) {
        let result = `<strong>${params[0].axisValue}</strong><br/>`;
        params.forEach((param) => {
          result += `${param.marker} ${param.seriesName}: ${param.value}<br/>`;
        });
        return result;
      },
    },
    legend: {
      type: "scroll",
      orient: "horizontal",
      bottom: 0,
      textStyle: {
        fontSize: 12,
      },
      data: ["Total Inventory", "Total Available", "Total Demand"],
    },
    grid: {
      top: 60,
      left: "10%",
      right: "10%",
      bottom: 80,
      containLabel: true,
    },
    toolbox: {
      show: true,
      orient: "vertical",
      left: "right",
      top: "center",
      feature: {
        dataView: { show: true, readOnly: false },
        magicType: { show: true, type: ["line", "bar"] },
        restore: { show: true },
        saveAsImage: { show: true },
      },
    },
    xAxis: {
      type: "category",
      data: chartData.dates,
      axisPointer: {
        type: "shadow",
      },
      axisLabel: {
        rotate: 45,
        fontSize: 10,
      },
    },
    yAxis: {
      type: "value",
      name: "Quantity",
      position: "left",
      axisLabel: {
        formatter: "{value}",
      },
    },
    series: chartData.series,
  };

  return (
    // <ReusableCard
    //   cardStyle={{
    //     display: "flex",
    //     flexDirection: "column",
    //     gap: "24px",
    //     alignSelf: "stretch",
    //     borderRadius: "8px",
    //     border: "1px solid var(--Gray-300, #D0D5DD)",
    //     background: "var(--Gray-100, #F2F4F7)",
    //     width: "100%",
    //     height: "500px",
    //     padding: "15px", // Moved from styles.body
    //   }}
    // >
      <ReactECharts
        option={option}
        style={{ height: "500px", width: "100%" }}
        opts={{ renderer: "canvas" }}
      />
    // </ReusableCard>
  );
};
