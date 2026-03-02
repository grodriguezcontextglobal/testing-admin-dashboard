import ReactECharts from "echarts-for-react";
import { useEffect, useMemo, useRef } from "react";

// --- Holiday Calculation Helpers ---

const formatDate = (date) => {
  // Use UTC methods to prevent timezone shifts from affecting the date.
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getFloatingHoliday = (year, month, dayOfWeek, occurrence) => {
  let count = 0;
  // Start from the first day of the month in UTC.
  const date = new Date(Date.UTC(year, month, 1));
  while (date.getUTCMonth() === month) {
    if (date.getUTCDay() === dayOfWeek) {
      count++;
      if (count === occurrence) {
        return date;
      }
    }
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return null; // Should not be reached for valid inputs
};

const getUSHolidaysForYears = (years) => {
  const holidays = new Set();
  const addHoliday = (date) => holidays.add(formatDate(date));

  for (const year of years) {
    // New Year's Day
    const newYear = new Date(Date.UTC(year, 0, 1));
    addHoliday(newYear);
    if (newYear.getUTCDay() === 6)
      addHoliday(new Date(Date.UTC(year - 1, 11, 31)));
    if (newYear.getUTCDay() === 0) addHoliday(new Date(Date.UTC(year, 0, 2)));

    // MLK Day - 3rd Monday in Jan
    addHoliday(getFloatingHoliday(year, 0, 1, 3));

    // Presidents' Day - 3rd Monday in Feb
    addHoliday(getFloatingHoliday(year, 1, 1, 3));

    // Memorial Day - Last Monday in May
    const may31 = new Date(Date.UTC(year, 4, 31));
    const memorialDay = new Date(may31);
    memorialDay.setUTCDate(may31.getUTCDate() - ((may31.getUTCDay() + 6) % 7));
    addHoliday(memorialDay);

    // Juneteenth
    const juneteenth = new Date(Date.UTC(year, 5, 19));
    addHoliday(juneteenth);
    if (juneteenth.getUTCDay() === 6)
      addHoliday(new Date(Date.UTC(year, 5, 18)));
    if (juneteenth.getUTCDay() === 0)
      addHoliday(new Date(Date.UTC(year, 5, 20)));

    // Independence Day
    const independenceDay = new Date(Date.UTC(year, 6, 4));
    addHoliday(independenceDay);
    if (independenceDay.getUTCDay() === 6)
      addHoliday(new Date(Date.UTC(year, 6, 3)));
    if (independenceDay.getUTCDay() === 0)
      addHoliday(new Date(Date.UTC(year, 6, 5)));

    // Labor Day - 1st Monday in Sep
    addHoliday(getFloatingHoliday(year, 8, 1, 1));

    // Columbus Day - 2nd Monday in Oct
    addHoliday(getFloatingHoliday(year, 9, 1, 2));

    // Veterans Day
    const veteransDay = new Date(Date.UTC(year, 10, 11));
    addHoliday(veteransDay);
    if (veteransDay.getUTCDay() === 6)
      addHoliday(new Date(Date.UTC(year, 10, 10)));
    if (veteransDay.getUTCDay() === 0)
      addHoliday(new Date(Date.UTC(year, 10, 12)));

    // Thanksgiving Day - 4th Thursday in Nov
    addHoliday(getFloatingHoliday(year, 10, 4, 4));

    // Christmas Day
    const christmasDay = new Date(Date.UTC(year, 11, 25));
    addHoliday(christmasDay);
    if (christmasDay.getUTCDay() === 6)
      addHoliday(new Date(Date.UTC(year, 11, 24)));
    if (christmasDay.getUTCDay() === 0)
      addHoliday(new Date(Date.UTC(year, 11, 26)));
  }
  return holidays;
};

// Daily Analysis Chart Component
export const DailyAnalysisChart = ({ dailyData }) => {
   const chartRef = useRef(null);
  const containerRef = useRef(null);

  const chartData = useMemo(() => {
 if (!dailyData?.length) return null;

    // IMPORTANT: keep series aligned with sorted dates
    const rows = [...dailyData].sort((a, b) => a.date.localeCompare(b.date));
    const sortedDates = rows.map((r) => r.date).sort();

    // // Extract dates and sort them
    // const sortedDates = dailyData.map((item) => item.date).sort();

    // --- Dynamic Weekend and Holiday Highlighting ---
    const years = new Set(
      sortedDates.map((date) => new Date(date + "T00:00:00Z").getFullYear()),
    );
    const holidays = getUSHolidaysForYears(years);

    const markAreaData = [];
    sortedDates.forEach((dateString) => {
      // Use UTC date to get the correct day of the week, avoiding timezone shifts.
      const date = new Date(dateString + "T00:00:00Z");
      const dayOfWeek = date.getUTCDay(); // 0 for Sunday, 6 for Saturday
      const isHoliday = holidays.has(dateString);

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
        data: rows.map((item) => item.total_inventory || 0),
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
        data: rows.map((item) => item.total_available || 0),
        itemStyle: { color: colors[1] },
        emphasis: {
          focus: "series",
        },
      },
      {
        name: "Total Demand",
        type: "line",
        data: rows.map((item) => item.total_demand || 0),
        itemStyle: { color: colors[2] },
        lineStyle: { color: colors[2], width: 3 },
        symbol: "circle",
        symbolSize: 6,
        emphasis: {
          focus: "series",
        },
      },
    ];
// setLoadingState(false)
//     return {
//       dates: sortedDates,
//       series: series,
//     };
    return { rows, dates: sortedDates, series: series };
  }, [dailyData]);
 useEffect(() => {
    if (!containerRef.current) return;

    const ro = new ResizeObserver(() => {
      const inst = chartRef.current?.getEchartsInstance?.();
      inst?.resize();
    });

    ro.observe(containerRef.current);

    // also do one resize after mount/data change
    const inst = chartRef.current?.getEchartsInstance?.();
    inst?.resize();

    return () => ro.disconnect();
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
      key={JSON.stringify(dailyData)}
      style={{
        border: "1px solid #D0D5DD",
        borderRadius: "8px",
        background: "#F2F4F7",
        padding: "15px",
        width: "100%",
      }}
    >
      <Legend />
{/* This wrapper is what we observe for real size changes */}
      <div ref={containerRef} style={{ width: "100%", height: 500 }}>
        <ReactECharts
          ref={chartRef}
          option={option}
          style={{ width: "100%", height: "100%" }}
          notMerge
          lazyUpdate
          opts={{ renderer: "canvas" }} // optional, see note below
        />
      </div>
    </div> 
  );
};
