import { devitrakApi } from "../../../../../../../api/devitrakApi";
import { onAddEventData } from "../../../../../../../store/slices/eventSlice";

export const checkAndUpdateGlobalEventStatus = async (
  eventInfo,
  dispatch,
  data = null,
  contextValue
) => {
  const { valueItemSelected } = contextValue;

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

  // Normalize keys: category + trimmed group
  const makeKey = (category, group) =>
    `${String(category || "")
      .trim()
      .toLowerCase()}::${String(group || "")
      .trim()
      .toLowerCase()}`;

  // Aggregate by normalized key, preserving existing value/depositAmount
  const aggregatedByKey = deviceSetup.reduce((acc, item) => {
    const key = makeKey(item.category, item.group);
    const qty = Number(item.quantity) || 0;

    if (!acc[key]) {
      acc[key] = {
        ...item,
        quantity: qty,
        startingNumber: item.startingNumber ?? null,
        endingNumber: item.endingNumber ?? null,
        value: Number(item.value) || 0, // keep existing group value
        depositAmount: Number.isFinite(Number(item.depositAmount))
          ? Number(item.depositAmount)
          : Number(item.value) || 0, // preserve if present, otherwise mirror value
      };
    } else {
      const prev = acc[key];
      acc[key] = {
        ...prev,
        quantity: (Number(prev.quantity) || 0) + qty,
        startingNumber: minSerial(prev.startingNumber, item.startingNumber),
        endingNumber: maxSerial(prev.endingNumber, item.endingNumber),
        // keep prev.value/depositAmount as-is during merge
      };
    }
    return acc;
  }, {});

  // Only update the exact bucket for the newly added item using data.deposit explicitly

  const addedKey = makeKey(
    valueItemSelected?.category_name,
    valueItemSelected?.item_group
  );
  const depositFromData = Number.isFinite(Number.parseFloat(data?.deposit))
    ? Number.parseFloat(data.deposit)
    : null;

  if (addedKey && depositFromData !== null && aggregatedByKey[addedKey]) {
    aggregatedByKey[addedKey].value = depositFromData;
    aggregatedByKey[addedKey].depositAmount = depositFromData;
  }
  const finalDeviceUpdated = Object.values(aggregatedByKey);
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
