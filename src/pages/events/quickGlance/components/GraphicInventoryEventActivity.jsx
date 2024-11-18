import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { groupBy } from "lodash";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import FormatQuickGlanceCardGraphRender from "./graphic/FormatQuickGlanceCardGraphRender";
const GraphicInventoryEventActivity = () => {
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const deviceStatusInEvent = useQuery({
    queryKey: ["devicesInEvent"],
    queryFn: () =>
      devitrakApi.get(`/receiver/receiver-pool-list?eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    deviceStatusInEvent.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  if (deviceStatusInEvent.data) {
    const checkNonFunctionalDeclaredDevice = (props) => {
      let result = [];
      const filteredData = new Set();
      for (let item of props) {
        if (item[0] !== "Operational") {
          if (item[0] !== "Lost") {
            result = [...result, item[1]?.length];
            filteredData.add(item);
          }
        }
      }
      return {
        data: Array.from(filteredData)?.length,
        value: result,
      };
    };
    const sortData = () => {
      const data = deviceStatusInEvent.data.data.receiversInventory;
      const groupingByStatus = groupBy(data, "status");
      const groupingByActivity = groupBy(data, "activity");
      const noFunctionalData = Object.entries(groupingByStatus);
      const nonFunctionalDeclaredDeviceEventData =
        checkNonFunctionalDeclaredDevice(noFunctionalData);
      return {
        checkedOut: groupingByActivity[true]
          ? groupingByActivity[true]?.length
          : 0,
        defected: nonFunctionalDeclaredDeviceEventData.value,
        onHand: groupingByActivity[false]
          ? groupingByActivity[false]?.length
          : 0,
        lost: groupingByStatus["Lost"]?.length ?? 0,
        total: data?.length ?? 0,
      };
    };
    sortData();

    const dataToExport = [
      { name: "Checked out", value: sortData().checkedOut },
      {
        name: "Not-Functional Report",
        value: sortData().defected,
      },
      { name: "On hands", value: sortData().onHand }, //numberDisplayDynamically()
      { name: "Lost", value: sortData().lost },
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
                totalDeviceInRange={sortData().total} //deviceRangeDisplay()
                index={index}
              />
            </Grid>
          );
        })}
      </Grid>
    );
  }
};

export default GraphicInventoryEventActivity;
