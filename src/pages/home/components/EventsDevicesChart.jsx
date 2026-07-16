import { useQuery } from "@tanstack/react-query";
import ReactECharts from "echarts-for-react";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import EmptyState from "../../../components/UX/emptyState/EmptyState";
import { getEventStatus } from "../../events/utils/getEventStatus";
import { sumDeviceSetup } from "./HomeKpiSection";

/**
 * Devices deployed per event (most recent 8). Live events highlighted in
 * action blue; everything else Deep Blue. Data comes from the shared
 * ["events"] query — no extra request.
 */
const EventsDevicesChart = () => {
  const { user } = useSelector((state) => state.admin);
  const chartRef = useRef(null);
  const boxRef = useRef(null);

  // echarts measures its container once at init; when this page remounts the
  // container can still be mid-layout, leaving a shrunken chart. Re-resize
  // whenever the container's size actually settles/changes.
  useEffect(() => {
    const box = boxRef.current;
    if (!box || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      chartRef.current?.getEchartsInstance?.()?.resize();
    });
    ro.observe(box);
    return () => ro.disconnect();
  });
  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: () =>
      devitrakApi.get(
        `/event/event-list-per-company?company=${user.company}&type=event`
      ),
    enabled: !!user.companyData.id,
  });

  const events = (eventsQuery.data?.data?.list ?? [])
    .slice()
    .sort(
      (a, b) =>
        new Date(b?.eventInfoDetail?.dateBegin ?? 0) -
        new Date(a?.eventInfoDetail?.dateBegin ?? 0)
    )
    .slice(0, 8)
    .reverse();

  if (events.length === 0) {
    return (
      <EmptyState
        compact
        icon="tabler:chart-bar"
        title="No events yet"
        description="Device deployment per event will chart here."
      />
    );
  }

  const rows = events.map((e) => ({
    name: e?.eventInfoDetail?.eventName ?? "—",
    value: sumDeviceSetup(e),
    live: getEventStatus(e).key === "live",
  }));

  const option = {
    grid: { left: 8, right: 8, top: 12, bottom: 4, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#171d1a",
      borderWidth: 0,
      borderRadius: 8,
      textStyle: { color: "#fff", fontFamily: "Inter", fontSize: 12 },
    },
    xAxis: {
      type: "category",
      data: rows.map((r) =>
        r.name.length > 16 ? `${r.name.slice(0, 15)}…` : r.name
      ),
      axisLine: { lineStyle: { color: "#ddded6" } },
      axisTick: { show: false },
      axisLabel: {
        fontFamily: "Inter",
        fontSize: 11,
        color: "#5d615a",
        interval: 0,
        rotate: rows.length > 4 ? 24 : 0,
      },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      splitLine: { lineStyle: { color: "#ddded6", type: "dashed" } },
      axisLabel: { fontFamily: "Inter", fontSize: 11, color: "#5d615a" },
    },
    series: [
      {
        type: "bar",
        barMaxWidth: 36,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
        },
        data: rows.map((r) => ({
          value: r.value,
          name: r.name,
          itemStyle: { color: r.live ? "#155eef" : "#021833" },
        })),
      },
    ],
  };

  return (
    <div ref={boxRef} style={{ width: "100%" }}>
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ width: "100%", height: 280 }}
        opts={{ renderer: "svg" }}
      />
    </div>
  );
};

export default EventsDevicesChart;
