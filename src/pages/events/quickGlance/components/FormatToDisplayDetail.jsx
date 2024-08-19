import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import _ from "lodash";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import CardRendered from "./CardRendered";
import { useEffect, useState } from "react";
import ModalListOfDefectedDevices from "./ModalListOfDefectedDevices";
const FormatToDisplayDetail = () => {
  const [defectedDeviceList, setDefectedDeviceList] = useState(false);
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const receiversPoolQuery = useQuery({
    queryKey: ["listOfreceiverInPool"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: event.eventInfoDetail.eventName,
        company: user.companyData.id,
      }),
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
    const foundAllDevicesGivenInEvent = () => {
      const receiversPoolData =
        receiversPoolQuery?.data?.data?.receiversInventory;
      if (receiversPoolData?.length > 0) return receiversPoolData;
      return [];
    };

    const foundAllNoOperatingDeviceInEvent = () => {
      const receiversPoolData =
        receiversPoolQuery?.data?.data?.receiversInventory;
      const groupingByReturnedStatus = _.groupBy(receiversPoolData, "status");
      let result = [];
      for (let data of Object.entries(groupingByReturnedStatus)) {
        if (data[0] !== "Operational") {
          result = [...result, data[1]?.length];
        }
      }
      return result.reduce((accu, curr) => accu + curr, 0);
    };

    const foundAllNoOperatingDeviceListInEvent = () => {
      const receiversPoolData =
        receiversPoolQuery?.data?.data?.receiversInventory;
      const groupingByReturnedStatus = _.groupBy(receiversPoolData, "status");
      let result = [];
      for (let data of Object.entries(groupingByReturnedStatus)) {
        if (data[0] !== "Operational") {
          result = [...result, ...data[1]];
        }
      }
      return result;
    };

    const foundDevicesOut = () => {
      let index = 0;
      for (let data of foundAllDevicesGivenInEvent()) {
        if (data.activity) {
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
      const dataRef = receiversPoolQuery?.data?.data?.receiversInventory;
      if (dataRef?.length > 0) {
        return deviceRangeDisplay() - foundDevicesOut();
      }
      return 0;
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
