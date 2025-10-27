import { devitrakApi } from "../../../../../../../api/devitrakApi";
import { onAddEventData } from "../../../../../../../store/slices/eventSlice";

export const checkAndUpdateGlobalEventStatus = async (eventInfo, dispatch) => {
  const latestUpdatedInventoryEvent = await devitrakApi.post(
    "/event/event-list",
    {
      _id: eventInfo.id,
    }
  );

  const deviceSetup =
    latestUpdatedInventoryEvent?.data?.list?.[0]?.deviceSetup ?? [];

  // Helpers to merge serial ranges
  const minSerial = (a, b) => {
    if (a == null) return b;
    if (b == null) return a;
    return String(a) <= String(b) ? a : b;
  };
  const maxSerial = (a, b) => {
    if (a == null) return b;
    if (b == null) return a;
    return String(a) >= String(b) ? a : b;
  };

  // Aggregate by item_group (value.group), summing quantities and merging serial ranges
  const aggregatedByGroup = deviceSetup.reduce((acc, item) => {
    const groupKey = String(item.group).toLowerCase();
    const qty = Number(item.quantity) || 0;
    if (!acc[groupKey]) {
      acc[groupKey] = {
        ...item,
        quantity: qty,
        startingNumber: item.startingNumber ?? null,
        endingNumber: item.endingNumber ?? null,
      };
    } else {
      const prev = acc[groupKey];
      acc[groupKey] = {
        ...prev,
        quantity: (Number(prev.quantity) || 0) + qty,
        startingNumber: minSerial(prev.startingNumber, item.startingNumber),
        endingNumber: maxSerial(prev.endingNumber, item.endingNumber),
      };
      console.log("acc[groupKey]", acc[groupKey]);
    }
    return acc;
  }, {});
  const finalDeviceUpdated = Object.values(aggregatedByGroup);
  await devitrakApi.patch(`/event/edit-event/${eventInfo.id}`, {
    deviceSetup: finalDeviceUpdated,
  });

  dispatch(
    onAddEventData({
      ...eventInfo,
      deviceSetup: finalDeviceUpdated,
    })
  );
};
