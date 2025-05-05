import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { groupBy } from "lodash";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import CardRendered from "./CardRendered";
import { useEffect, useState } from "react";
import ModalListOfDefectedDevices from "./ModalListOfDefectedDevices";
import checkTypeFetchResponse from "../../../../components/utils/checkTypeFetchResponse";
const FormatToDisplayDetail = () => {
  const [defectedDeviceList, setDefectedDeviceList] = useState(false);
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const receiversPoolQuery = useQuery({
    queryKey: ["listOfreceiverInPool"],
    queryFn: () =>
      devitrakApi.get(
        `/receiver/receiver-pool-list?eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`
      ),
    refetchOnMount: false,
  });
  const receiversNoOperatingInPoolQuery = useQuery({
    queryKey: ["listOfNoOperatingDevices"],
    queryFn: () =>
      devitrakApi.post("/receiver/list-receiver-returned-issue", {
        eventSelected: event.eventInfoDetail.eventName,
        company: user.companyData.id,
      }),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    receiversPoolQuery.refetch();
    receiversNoOperatingInPoolQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  if (receiversPoolQuery.data && receiversNoOperatingInPoolQuery.data) {
    const inventoryEventData = checkTypeFetchResponse(
      receiversPoolQuery.data.data.receiversInventory
    );
    const foundAllDevicesGivenInEvent = () => {
      const receiversPoolData = inventoryEventData;
      if (receiversPoolData?.length > 0) return receiversPoolData;
      return [];
    };

    const foundAllNoOperatingDeviceInEvent = () => {
      const receiversPoolData = inventoryEventData;
      const groupingByReturnedStatus = groupBy(receiversPoolData, "status");
      let result = [];
      for (let data of Object.entries(groupingByReturnedStatus)) {
        if (data[0] !== "Operational") {
          result = [...result, data[1]?.length];
        }
      }
      return result.reduce((accu, curr) => accu + curr, 0);
    };

    const foundAllNoOperatingDeviceListInEvent = () => {
      const receiversPoolData = inventoryEventData;
      const groupingByReturnedStatus = groupBy(receiversPoolData, "status");
      let result = [];
      for (let data of Object.entries(groupingByReturnedStatus)) {
        if (data[0] !== "Operational") {
          result = [...result, ...data[1]];
        }
      }
      return result;
    };

    const foundDevicesOut = () => {
      const groupingByActivity = groupBy(foundAllDevicesGivenInEvent(), "activity");
      if(groupingByActivity?.true?.length > 0) return groupingByActivity?.true?.length;
      return 0;
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
      const dataRef = inventoryEventData;
      if (dataRef?.length > 0) {
        return deviceRangeDisplay() - foundDevicesOut();
      }
      return 0;
    };

    return (
      <Grid container spacing={1}>
        <Grid item xs={12} sm={12} md={12} lg={4}>
          <CardRendered
            key={"Total devices of event."}
            props={inventoryEventData?.length ?? 0}
            title={"Total inventory of event."}
          />
        </Grid>
        <Grid item xs={12} sm={12} md={12} lg={4}>
          <CardRendered
            key={"Total devices on hand for consumer use"}
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
          <button
            onClick={() => setDefectedDeviceList(true)}
            style={{
              backgroundColor: "transparent",
              outline: "none",
              width: "100%",
              padding: 0,
              margin: 0,
            }}
          >
            <CardRendered
              key={"Total lost/defected devices"}
              props={foundAllNoOperatingDeviceInEvent()}
              title={"Total devices not functional"}
            />
          </button>
        </Grid>
        {defectedDeviceList && (
          <ModalListOfDefectedDevices
            data={foundAllNoOperatingDeviceListInEvent()}
            defectedDeviceList={defectedDeviceList}
            setDefectedDeviceList={setDefectedDeviceList}
          />
        )}
      </Grid>
    );
  }
};

export default FormatToDisplayDetail;
