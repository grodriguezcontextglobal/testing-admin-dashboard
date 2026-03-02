import ReactECharts from "echarts-for-react";
import { useMemo } from "react";

// Daily Analysis Chart Component
export const DailyAnalysisChart = ({ dailyData }) => {
  const chartData = useMemo(() => {
    if (!dailyData || dailyData.length === 0) return null;

    // Extract dates and sort them
    const sortedDates = dailyData.map((item) => item.date).sort();

    // --- Weekend and Holiday Highlighting ---
    const holidays = [
      // 2026 US Holidays
      "2026-01-01", // New Year's Day
      "2026-01-19", // Martin Luther King, Jr. Day
      "2026-02-16", // Presidents' Day
      "2026-05-25", // Memorial Day
      "2026-06-19", // Juneteenth
      "2026-07-03", // Independence Day (Observed, as 4th is a Saturday)
      "2026-07-04", // Independence Day
      "2026-09-07", // Labor Day
      "2026-10-12", // Columbus Day
      "2026-11-11", // Veterans Day
      "2026-11-26", // Thanksgiving Day
      "2026-12-25", // Christmas Day
    ];

    const markAreaData = [];
    sortedDates.forEach((dateString) => {
      // Use UTC date to get the correct day of the week, avoiding timezone shifts.
      const date = new Date(dateString + "T00:00:00Z");
      const dayOfWeek = date.getUTCDay(); // 0 for Sunday, 6 for Saturday
      const isHoliday = holidays.includes(dateString);

      if (isHoliday || dayOfWeek === 0) {
        // Sunday or Holiday
        markAreaData.push([
          {
            xAxis: dateString,
            itemStyle: { color: "rgba(255, 82, 82, 0.2)" }, // Red
          },
          { xAxis: dateString },
        ]);
      } else if (dayOfWeek === 6) {
        // Saturday
        markAreaData.push([
          {
            xAxis: dateString,
            itemStyle: { color: "rgba(255, 255, 0, 0.4)" }, // Yellow
          },
          { xAxis: dateString },
        ]);
      }
    });
    // --- End of Highlighting Logic ---

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
        // Add markArea to highlight weekends and holidays
        markArea: {
          data: markAreaData,
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

  const Legend = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "20px",
        padding: "10px 20px",
        fontFamily: "Inter, sans-serif",
        fontSize: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "14px",
            height: "14px",
            backgroundColor: "#fff",
            border: "1px solid #ccc",
          }}
        ></div>
        <span>Weekdays</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "14px",
            height: "14px",
            backgroundColor: "rgba(255, 255, 0, 0.4)",
          }}
        ></div>
        <span>Saturday</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "14px",
            height: "14px",
            backgroundColor: "rgba(255, 82, 82, 0.2)",
          }}
        ></div>
        <span>Sunday / Holiday</span>
      </div>
    </div>
  );

  return (
    <div
      style={{
        border: "1px solid #D0D5DD",
        borderRadius: "8px",
        background: "#F2F4F7",
        padding: "15px",
        width:"100%"
      }}
    >
      <Legend />
      <ReactECharts
        option={option}
        style={{ height: "500px", width: "100%" }}
        opts={{ renderer: "canvas" }}
      />
    </div>
  );
};
