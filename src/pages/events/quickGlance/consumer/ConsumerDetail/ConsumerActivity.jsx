import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import _ from 'lodash';
import TotalDevicesDistributed from "./ConsumerActivity/TotalDeviceDistributed";
import TotalRequestedDevice from "./ConsumerActivity/TotalRequestedDevice";
import TotalReturnedDevice from "./ConsumerActivity/TotalReturnedDevice";
const ConsumerActivity
  = () => {
    const { event } = useSelector((state) => state.event);
    const { customer } = useSelector((state) => state.customer);
    const stripeTransactionsSavedQuery = useQuery({
      queryKey: ["transactionsList"],
      queryFn: () => devitrakApi.post("/transaction/transaction", { eventSelected: event.eventInfoDetail.eventName, provider: event.company, "consumerInfo.email": customer.email }),
      refetchOnMount: false,
      cacheTime: 1000 * 60 * 3
    });
    const receiversAssignedQuery = useQuery({
      queryKey: ["listOfDevicesAssigned"],
      queryFn: () => devitrakApi.post("/receiver/receiver-assigned-list", { eventSelected: event.eventInfoDetail.eventName, provider: event.company, user: customer.email }),
      refetchOnMount: false,
      cacheTime: 1000 * 60 * 3
    });
    const deviceAssignedListQuery = useQuery({
      queryKey: ["listOfNoOperatingDevices"],
      queryFn: () => devitrakApi.get("/receiver/list-receiver-returned-issue"),
      refetchOnMount: false,
      cacheTime: 1000 * 60 * 3
    });

    if (stripeTransactionsSavedQuery.isLoading) return <p>Loading...</p>;
    if (
      stripeTransactionsSavedQuery.data &&
      deviceAssignedListQuery.data &&
      receiversAssignedQuery.data
    ) {
      const totalDevicesRequestedPerConsumer = () => {
        const firstResult = new Set()
        for (let data of stripeTransactionsSavedQuery.data.data.list) {
          firstResult.add(data.device[0])
        }
        return Array.from(firstResult).reduce(
          (accumulator, curr) => accumulator + curr.deviceNeeded,
          0
        );
      };

      const displayAllAssignedDeviceDistributed = () => {
        const firstResult = new Set()
        for (let data of receiversAssignedQuery.data.data.listOfReceivers) {
           firstResult.add(data.device)
        }
        return Array.from(firstResult).length
      };

      const foundAllAssignedDevicesReturnPerConsumer = () => {
        const firstResult = new Set()
        for (let data of receiversAssignedQuery.data.data.listOfReceivers) {
          if (!data.device.status) {
            firstResult.add(data.device)
          }
        }
        return Array.from(firstResult).length
      };
      return (
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          container
        >
          <Grid item xs={12} sm={12} md={6} lg={4}>
            {" "}
            <TotalRequestedDevice
              totalDevicesRequestedPerConsumer={totalDevicesRequestedPerConsumer()}
            />
          </Grid>
          <Grid item xs={12} sm={12} md={6} lg={4}>
            <TotalDevicesDistributed
              displayAllAssignedDeviceDistributed={displayAllAssignedDeviceDistributed()}
            />
          </Grid>
          <Grid item xs={12} sm={12} md={6} lg={4}>
            <TotalReturnedDevice
              foundAllAssignedDevicesReturnPerConsumer={foundAllAssignedDevicesReturnPerConsumer()}
            />
          </Grid>
        </Grid>
      );
    }
  };

export default ConsumerActivity
  ;