import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import checkTypeFetchResponse from "../../../../components/utils/checkTypeFetchResponse";
import DeviceHealthBar from "./DeviceHealthBar";
import { needsAttention, summarizeEventDevices } from "../utils/eventDeviceSummary";
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

    return (
      <>
        <DeviceHealthBar
          summary={summarizeEventDevices(pool)}
          onOpenIssuesList={() => setDefectedDeviceList(true)}
        />
        {defectedDeviceList && (
          <ModalListOfDefectedDevices
            data={pool.filter(needsAttention)}
            defectedDeviceList={defectedDeviceList}
            setDefectedDeviceList={setDefectedDeviceList}
          />
        )}
      </>
    );
  }
};

export default FormatToDisplayDetail;
