import { Grid } from "@mui/material";
import FormatQuickGlanceCardGraphRender from "./graphic_components/FormatQuickGlanceCardGraphRender";
import _ from "lodash";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
const Graphic = () => {
  const { user } = useSelector((state) => state.admin);
  const [defectedDeviceList, setDefectedDeviceList] = useState(0);
  const [lostDeviceList, setLostDeviceList] = useState(0);
  const itemInInventoryQuery = useQuery({
    queryKey: ["listOfreceiverInPool"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", { company: user.company }),
    // enabled: false,
    refetchOnMount: false,
  });

  const foundAllDevicesGivenInEvent = useCallback(() => {
    if (itemInInventoryQuery?.data?.data.ok) {
      const groupingByStatus = _.groupBy(
        itemInInventoryQuery.data.data.items,
        "warehouse"
      );
      if (groupingByStatus[1]) {
        return {
          out: groupingByStatus[0] ?? [],
          in: groupingByStatus[1] ?? [],
        };
      }
      return [];
    }
    return [];
  }, [itemInInventoryQuery.data]);

  const foundAllNoOperatingDeviceInEvent = useCallback(async () => {
    const result = new Map();
    const checkDefectedDeviceList = await devitrakApi.post(
      "/receiver/list-receiver-returned-issue",
      { provider: user.company }
    );
    if (checkDefectedDeviceList?.data?.ok) {
      const groupingByStatus = _.groupBy(
        checkDefectedDeviceList.data.record,
        "status"
      );
      for (let [key, value] of Object.entries(groupingByStatus)) {
        if (String(key).toLowerCase() !== "lost") {
          if (!result.has(key)) {
            result.set(key, value);
          } else {
            result.set(key, [...value, ...result.get(key)]);
          }
        }
      }
    }
    const finalResult = new Set();
    for (let [, value] of result) {
      finalResult.add(value.length);
    }
    return setDefectedDeviceList(
      Array.from(finalResult).reduce((accu, curr) => accu + curr, 0)
    );
  }, []);

  const lostDeviceInEvent = useCallback(async () => {
    const checkDefectedDeviceList = await devitrakApi.post(
      "/receiver/list-receiver-returned-issue",
      { provider: user.company, status: "Lost" }
    );
    if (checkDefectedDeviceList?.data?.ok)
      return setLostDeviceList(checkDefectedDeviceList.length);
    return 0;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    foundAllNoOperatingDeviceInEvent();
    foundAllDevicesGivenInEvent();
    lostDeviceInEvent();
    itemInInventoryQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);
  const foundDevicesOut = useCallback(() => {
    const check = foundAllDevicesGivenInEvent()["out"];
    if (check) return check.length;
    return 0;
  }, [itemInInventoryQuery.data, itemInInventoryQuery.isLoading]);
  const foundDevicesInWarehouse = useCallback(() => {
    const check = foundAllDevicesGivenInEvent()["in"];
    if (check) return check.length;
    return 0;
  }, [itemInInventoryQuery.data, itemInInventoryQuery.isLoading]);
  const dataToExport = [
    { name: "Checked out", value: foundDevicesOut() },
    {
      name: "Not-Functional Report",
      value: defectedDeviceList,
    },
    { name: "On hands", value: foundDevicesInWarehouse() }, //numberDisplayDynamically()
    { name: "Lost", value: lostDeviceList },
  ];

  const dataToMap = [dataToExport];
  return (
    <Grid
      display={"flex"}
      justifyContent={"space-between"}
      alignItems={"center"}
      margin={"-10px 0 0 0"}
    >
      {dataToMap?.map((item, index) => {
        return (
          <Grid key={index} item xs={12}>
            <FormatQuickGlanceCardGraphRender
              key={index}
              dataToRender={item}
              totalDeviceInRange={
                itemInInventoryQuery?.data?.data?.items?.length ?? 0
              } //deviceRangeDisplay()
              index={index}
            />
          </Grid>
        );
      })}
    </Grid>
  );
};
export default Graphic;
