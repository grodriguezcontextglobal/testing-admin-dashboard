import {
  Bar,
  CartesianGrid,
  Label,
  Legend,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceArea,
} from "recharts";
import { useMemo } from "react";
import { getUSHolidaysForYears } from "../../../utils/dateUtils";
import "./LineBar.css";

const CustomLegend = (props) => {
  const { payload } = props;
  const weekendColor = "rgba(255, 255, 0, 0.4)";
  const holidayColor = "rgba(255, 82, 82, 0.2)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      {payload.map((entry, index) => (
        <div
          key={`item-${index}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            marginBottom: "4px",
          }}
        >
          <span
            style={{
              width: "10px",
              height: "10px",
              backgroundColor: entry.color,
            }}
          ></span>
          <span>{entry.value}</span>
        </div>
      ))}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "12px",
          marginBottom: "4px",
        }}
      >
        <span
          style={{
            width: "10px",
            height: "10px",
            backgroundColor: holidayColor,
          }}
        ></span>
        <span>Sunday/Holiday</span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "12px",
        }}
      >
        <span
          style={{
            width: "10px",
            height: "10px",
            backgroundColor: weekendColor,
          }}
        ></span>
        <span>Saturday</span>
      </div>
    </div>
  );
};

export const BarChart = ({ data }) => {
  const colors = {
    total_inventory: "#2196F3",
    total_available: "#4CAF50",
    total_demand: "#FFC107",
  };

  const backgroundAreas = useMemo(() => {
    if (!data) return [];
    const years = new Set(data.map((d) => new Date(d.date).getFullYear()));
    const holidays = getUSHolidaysForYears(years);
    const areas = [];
    for (const item of data) {
      const date = new Date(item.date);
      const dayOfWeek = date.getUTCDay();
      const dateString = item.date.split("T")[0];
      if (holidays.has(dateString) || dayOfWeek === 0) {
        areas.push(
          <ReferenceArea
            key={item.date}
            x1={item.date}
            x2={item.date}
            fill="rgba(255, 82, 82, 0.2)"
            strokeOpacity={0.3}
          />,
        );
      } else if (dayOfWeek === 6) {
        areas.push(
          <ReferenceArea
            key={item.date}
            x1={item.date}
            x2={item.date}
            fill="rgba(255, 255, 0, 0.4)"
            strokeOpacity={0.3}
          />,
        );
      }
    }
    return areas;
  }, [data]);

  return (
    <ResponsiveContainer height={300}>
      <RechartsBarChart
        data={data}
        className="text-tertiary"
        margin={{
          left: 4,
          right: 0,
          top: 12,
          bottom: 18,
        }}
      >
        {backgroundAreas}
        <CartesianGrid
          vertical={false}
          stroke="currentColor"
          className="text-utility-gray-100"
        />

        <Legend
          verticalAlign="top"
          align="right"
          layout="vertical"
          content={<CustomLegend />}
        />

        <XAxis
          fill="currentColor"
          axisLine={false}
          tickLine={false}
          tickMargin={11}
          interval="preserveStartEnd"
          dataKey="date"
          tickFormatter={(value) =>
            new Date(value).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })
          }
        >
          <Label
            value="Date"
            fill="currentColor"
            className="recharts-label"
            position="bottom"
          />
        </XAxis>

        <YAxis
          fill="currentColor"
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          tickFormatter={(value) => Number(value).toLocaleString()}
        >
          <Label
            value="Quantity"
            fill="currentColor"
            className="recharts-label"
            style={{ textAnchor: "middle" }}
            angle={-90}
            position="insideLeft"
          />
        </YAxis>

        <Tooltip
          formatter={(value) => Number(value).toLocaleString()}
          labelFormatter={(value) =>
            new Date(value).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          }
          cursor={{
            className: "recharts-tooltip-cursor",
          }}
        />

        <Bar
          isAnimationActive={false}
          dataKey="total_inventory"
          name="Total Inventory"
          type="monotone"
          stackId="a"
          fill={colors.total_inventory}
          maxBarSize={32}
        />
        <Bar
          isAnimationActive={false}
          dataKey="total_available"
          name="Total Available"
          type="monotone"
          stackId="a"
          fill={colors.total_available}
          maxBarSize={32}
        />
        <Bar
          isAnimationActive={false}
          dataKey="total_demand"
          name="Total Demand"
          type="monotone"
          stackId="a"
          fill={colors.total_demand}
          maxBarSize={32}
          radius={[6, 6, 0, 0]}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};
