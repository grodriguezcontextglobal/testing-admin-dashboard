import { groupBy } from "lodash";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import { onAddEventData } from "../../../../../../../store/slices/eventSlice";

export async function updateGlobalEventInventoryFromPool({
  event,
  dispatch,
  xlsxData,
}) {
  const deviceSetup = Array.isArray(event?.deviceSetup)
    ? event.deviceSetup
    : [];
  const companyId =
    event?.company_id ?? event?.companyData?.id ?? event?.company ?? null;
  const eventSelected =
    event?.eventInfoDetail?.eventName ?? event?.eventName ?? null;
  if (!companyId || !eventSelected) {
    throw new Error("Missing company or event name to retrieve pool list");
  }

  const poolRes = await devitrakApi.post("/receiver/receiver-pool-list", {
    company: companyId,
    eventSelected,
  });
  const poolItems = poolRes?.data?.receiversInventory || [];
  const byType = groupBy(poolItems, "type");

  const minSerial = (a, b) => {
    if (a == null) return b;
    if (b == null) return a;
    return String(a).localeCompare(String(b), undefined, { numeric: true }) <= 0
      ? a
      : b;
  };
  const maxSerial = (a, b) => {
    if (a == null) return b;
    if (b == null) return a;
    return String(a).localeCompare(String(b), undefined, { numeric: true }) >= 0
      ? a
      : b;
  };

  const xlsxTypeData = {};
  if (xlsxData instanceof Map) {
    xlsxData.forEach((items, groupName) => {
      const serials = items
        .map((item) => String(item.serial_number))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      xlsxTypeData[groupName] = {
        serials,
        min: serials[0] ?? null,
        max: serials[serials.length - 1] ?? null,
        qty: serials.length,
        items,
      };
    });
  }

  const allTypes = [
    ...new Set([...Object.keys(byType), ...Object.keys(xlsxTypeData)]),
  ];

  const updated = [...deviceSetup];

  for (const typeName of allTypes) {
    const poolList = byType[typeName] || [];
    let serials = [];
    let rangeMin = null;
    let rangeMax = null;
    let qty = 0;
    let items = [];

    if (Array.isArray(poolList) && poolList.length > 0) {
      serials = poolList
        .map((x) => String(x.device))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      rangeMin = serials[0] ?? null;
      rangeMax = serials[serials.length - 1] ?? null;
      qty = serials.length;
    } else if (xlsxTypeData[typeName]) {
      serials = xlsxTypeData[typeName].serials;
      rangeMin = xlsxTypeData[typeName].min;
      rangeMax = xlsxTypeData[typeName].max;
      qty = xlsxTypeData[typeName].qty;
      items = xlsxTypeData[typeName].items || [];
    } else {
      continue;
    }

    const idx = updated.findIndex((d) => String(d.group) === String(typeName));
    if (idx >= 0) {
      const curr = updated[idx];
      updated[idx] = {
        ...curr,
        quantity: qty,
        startingNumber: minSerial(curr?.startingNumber ?? null, rangeMin),
        endingNumber: maxSerial(curr?.endingNumber ?? null, rangeMax),
      };
    } else {
      const firstItem = items[0] || {};
      updated.push({
        category: firstItem.category_name || typeName,
        group: typeName,
        value: Number(firstItem.cost || 0),
        description: firstItem.descript_item || "",
        company: event?.company ?? "",
        quantity: qty,
        ownership: firstItem.ownership || "Owned",
        createdBy: new Date().toISOString(),
        key: `${typeName}-${Date.now()}`,
        dateCreated: new Date().toISOString(),
        resume: `${typeName} ${qty}`,
        consumerUses: false,
        startingNumber: rangeMin,
        endingNumber: rangeMax,
        existing: true,
      });
    }
  }

  await devitrakApi.patch(`/event/edit-event/${event.id}`, {
    deviceSetup: updated,
  });
  dispatch(
    onAddEventData({
      ...event,
      deviceSetup: updated,
    })
  );
  return updated;
}
