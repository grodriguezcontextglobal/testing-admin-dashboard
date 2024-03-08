import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import CardRendered from "./CardRendered";
const FormatToDisplayDetail = () => {
  const { event } = useSelector((state) => state.event);
  const receiversPoolQuery = useQuery({
    queryKey: ["listOfreceiverInPool"],
    queryFn: () => devitrakApi.post("/receiver/receiver-pool-list", { eventSelected: event.eventInfoDetail.eventName, provider: event.company }),
  });
  const receiversNoOperatingInPoolQuery = useQuery({
    queryKey: ["listOfNoOperatingDevices"],
    queryFn: () => devitrakApi.post("/receiver/list-receiver-returned-issue", { eventSelected: event.eventInfoDetail.eventName, provider: event.company }),
  });

  if (receiversPoolQuery.data && receiversNoOperatingInPoolQuery.data) {
    const foundAllDevicesGivenInEvent = () => {
      const receiversPoolData = receiversPoolQuery?.data?.data?.receiversInventory
      if (receiversPoolData.length > 0) return receiversPoolData
      return [];
    };

    const foundAllNoOperatingDeviceInEvent = () => {
      const defectDeviceData = receiversNoOperatingInPoolQuery?.data?.data?.record
      if (defectDeviceData) {
        return defectDeviceData
      }
      return [];
    };

    const foundDevicesOut = () => {
      let index = 0;
      for (let data of foundAllDevicesGivenInEvent()) {
        if (data.activity === "YES") {
          index++;
        }
      }
      return index;
    };

    const deviceRangeDisplay = () => {
      let allItemsForConsumers = 0;
      for (let data of event.deviceSetup) {
        if (data.consumerUses) {
          allItemsForConsumers += Number(data.quantity);
        }
      }
      return allItemsForConsumers;
    };
    deviceRangeDisplay();

    const numberDisplayDynamically = () => {
      return deviceRangeDisplay() - foundDevicesOut();
    };
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} sm={12} md={12} lg={4}>
          <CardRendered
            key={"Total devices on hand"}
            props={numberDisplayDynamically()}
            title={"Total devices on hand, including not functional"}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={4}>
          <CardRendered
            key={"Total devices checked out"}
            props={foundDevicesOut()}
            title={"Total devices checked out"}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={4}>
          <CardRendered
            key={"Total devices not functional"}
            props={foundAllNoOperatingDeviceInEvent().length}
            title={"Total devices not functional"}
          />
        </Grid>
      </Grid>
    );
  }
};

export default FormatToDisplayDetail;