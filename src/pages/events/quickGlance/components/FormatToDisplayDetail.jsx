import { useQuery } from "@tanstack/react-query";
import { groupBy } from "lodash";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import checkTypeFetchResponse from "../../../../components/utils/checkTypeFetchResponse";
import DeviceHealthBar from "./DeviceHealthBar";
import ModalListOfDefectedDevices from "./ModalListOfDefectedDevices";

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
    enabled: !!event.eventInfoDetail.eventName && !!user.companyData.id,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (receiversPoolQuery.data && receiversNoOperatingInPoolQuery.data) {
    const inventoryEventData = checkTypeFetchResponse(
      receiversPoolQuery.data.data.receiversInventory
    );
    const pool = Array.isArray(inventoryEventData) ? inventoryEventData : [];

    // Devices with a non-Operational status, for the issues modal (lost + defective).
    const foundAllNoOperatingDeviceListInEvent = () => {
      const groupingByReturnedStatus = groupBy(pool, "status");
      let result = [];
      for (let data of Object.entries(groupingByReturnedStatus)) {
        if (data[0] !== "Operational") {
          result = [...result, ...data[1]];
        }
      }
      return result;
    };

    // Mutually exclusive counts that sum to the pool total — one honest story.
    const isLost = (item) => `${item.status}`.toLowerCase() === "lost";
    const isDefective = (item) => item.status !== "Operational" && !isLost(item);
    const lost = pool.filter(isLost).length;
    const needsRepair = pool.filter(isDefective).length;
    const checkedOut = pool.filter(
      (item) => item.activity && !isLost(item) && !isDefective(item)
    ).length;
    const onHand = Math.max(0, pool.length - lost - needsRepair - checkedOut);

    return (
      <>
        <DeviceHealthBar
          counts={{ checkedOut, onHand, needsRepair, lost }}
          onOpenIssuesList={() => setDefectedDeviceList(true)}
        />
        {defectedDeviceList && (
          <ModalListOfDefectedDevices
            data={foundAllNoOperatingDeviceListInEvent()}
            defectedDeviceList={defectedDeviceList}
            setDefectedDeviceList={setDefectedDeviceList}
          />
        )}
      </>
    );
  }
};

export default FormatToDisplayDetail;
