import { devitrakApi } from "../../../../../../../api/devitrakApi";
import { onAddEventData } from "../../../../../../../store/slices/eventSlice";

const checkGlobalForUpdateEventInventory = async ({
  event,
  newData,
  dispatch,
}) => {
  const latestUpdatedInventoryEvent = await devitrakApi.post(
    "/event/event-list",
    {
      _id: event.id,
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

  // Sort newData by serial number and update starting/ending numbers in matching device setup buckets
  const dataList = Array.isArray(newData) ? newData.slice() : [];
  if (dataList.length > 0) {
    // Group newData by normalized key: category_name + item_group
    const groupedNewData = dataList.reduce((acc, item) => {
      const key = makeKey(item?.category_name, item?.item_group);
      const serial = String(item?.serial_number ?? "");
      if (!serial) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push(serial);
      return acc;
    }, {});

    Object.entries(groupedNewData).forEach(([key, serials]) => {
      // Sort ascending (lexical) for consistency with string-based min/max comparisons
      serials.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      const groupMin = serials[0];
      const groupMax = serials[serials.length - 1];

      if (aggregatedByKey[key]) {
        const prev = aggregatedByKey[key];
        aggregatedByKey[key] = {
          ...prev,
          startingNumber:
            prev.startingNumber == null
              ? groupMin
              : minSerial(prev.startingNumber, groupMin),
          endingNumber:
            prev.endingNumber == null
              ? groupMax
              : maxSerial(prev.endingNumber, groupMax),
        };
      }
    });
  }

  // Optional: update deposit/value for the first matched bucket if provided in newData
  const firstItem = Array.isArray(newData) ? newData[0] : newData;
  const addedKey = makeKey(firstItem?.category_name, firstItem?.item_group);
  const depositFromData = Number.isFinite(Number.parseFloat(firstItem?.deposit))
    ? Number.parseFloat(firstItem.deposit)
    : null;
  if (addedKey && depositFromData !== null && aggregatedByKey[addedKey]) {
    aggregatedByKey[addedKey].value = depositFromData;
    aggregatedByKey[addedKey].depositAmount = depositFromData;
  }
  const finalDeviceUpdated = Object.values(aggregatedByKey);
  await devitrakApi.patch(`/event/edit-event/${event.id}`, {
    deviceSetup: finalDeviceUpdated,
  });

  dispatch(
    onAddEventData({
      ...event,
      deviceSetup: finalDeviceUpdated,
    })
  );
};

export default checkGlobalForUpdateEventInventory;
