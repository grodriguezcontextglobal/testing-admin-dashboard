import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { groupBy } from "lodash";
import { lazy, Suspense, useEffect } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import CenteringGrid from "../../../styles/global/CenteringGrid";
// import FormatQuickGlanceCardGraphRender from "./graphic_components/FormatQuickGlanceCardGraphRender";
const FormatQuickGlanceCardGraphRender = lazy(() =>
  import("./graphic_components/FormatQuickGlanceCardGraphRender")
);
const Graphic = () => {
  const { user } = useSelector((state) => state.admin);
  const itemInInventoryQuery = useQuery({
    queryKey: ["listOfreceiverInPool"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
      }),
    refetchOnMount: false,
  });

  const foundAllDevicesGivenInEvent = () => {
    if (itemInInventoryQuery?.data?.data.ok) {
      const groupingByStatus = groupBy(
        itemInInventoryQuery.data.data.items,
        "warehouse"
      );
      if (groupingByStatus[0] || groupingByStatus[1]) {
        return {
          out: groupingByStatus[0] ?? [],
          in: groupingByStatus[1] ?? [],
        };
      }
      return [];
    }
    return [];
  };
  useEffect(() => {
    const controller = new AbortController();
    // foundAllNoOperatingDeviceInEvent();
    foundAllDevicesGivenInEvent()
    // lostDeviceInEvent();
    itemInInventoryQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  const foundDevicesOut = () => {
    const check = foundAllDevicesGivenInEvent()['out'];
    if (check) return check.length;
    return 0;
  };

  const foundDevicesInWarehouse = () => {
    const check = foundAllDevicesGivenInEvent()['in'];
    if (check) return check.length;
    return 0;
  };

  const dataToExport = [
    {
      name: "In stock",
      value: foundDevicesInWarehouse()
    },
    { name: "Checked out", value: foundDevicesOut() },
    // {
    //   name: "Not-Functional Report",
    //   value: defectedDeviceList,
    // },
    // { name: "Lost", value: lostDeviceList ?? 0 },
  ];

  const dataToMap = [dataToExport];
  return (
    <Suspense fallback={<div style={CenteringGrid}><Loading /></div>}>
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
              }
              index={index}
            />
          </Grid>
        );
      })}
    </Grid>
    </Suspense>
  );
};
export default Graphic;
