import { checkArray } from "../../../components/utils/checkArray";

/**
 * The value of one device group in a transaction's event inventory: the
 * latest entry for the group, or (for an event, not a lease) the first
 * device's value.
 */
const groupValue = (rowRecord, group) => {
  const { device, type } = checkArray(rowRecord?.eventInfo) ?? {};
  const latest = device?.filter((element) => element.group === group)?.at(-1)?.value;
  if (type === "lease") return latest;
  return latest ?? device?.[0]?.deviceValue;
};

/**
 * The device table inside a consumer's transaction row (ExpandedRow): one row
 * per receiver assigned in the transaction.
 *
 * @param {Array|undefined} listOfReceivers from the assigned-devices query
 * @param {object} rowRecord the transaction row
 */
export const buildTransactionDeviceRows = (listOfReceivers, rowRecord) => {
  if (!Array.isArray(listOfReceivers)) return [];
  return listOfReceivers.map((data) => ({
    key: data._id,
    serial_number: data?.device?.serialNumber,
    type: data?.device?.deviceType,
    deviceValue:
      groupValue(rowRecord, data?.device?.deviceType) ??
      rowRecord?.eventInfo?.[0]?.device?.[0]?.deviceValue,
    status: data?.device?.status,
    timeStamp: data?.timeStamp,
    entireData: data,
    transactionData: rowRecord,
  }));
};
