import { parseDateValue } from "./deviceProfileModel";

/**
 * Returning to the warehouse a device that a staff member is holding, from
 * the device's own page.
 *
 * 2b.10, meeting 2026-09-29 `[21]`: somebody finds a device in the corridor
 * that the records say is out with someone, and needs to put it back where it
 * belongs. The page already offered "Return device", but only when the holder
 * was a member — a device out with a staff member offered nothing.
 *
 * The return itself is `ModalReturnDeviceFromStaff`, which runs the whole
 * chain: close the lease, delete its row, and take the device off the event if
 * it was on one. That is the tracker's condition for this task — go through
 * the real return, never flip a field, or the event keeps counting the device
 * as out.
 *
 * That modal reads the lease flat and the inventory record under
 * `item_id_info`, which the caller assembles: the staff table joins the lease
 * with the item it already has, and here the item is the page's own.
 */

/**
 * The staff loan this device is on.
 *
 * `lease_info` rows are deleted on return — the profile hook says so where it
 * fetches them — so any row here is an open loan. The newest wins when a
 * device somehow carries more than one.
 */
export const openStaffLeaseRow = (staffLeases) => {
  const rows = Array.isArray(staffLeases) ? staffLeases.filter(Boolean) : [];
  if (rows.length === 0) return null;
  return rows.reduce((newest, row) => {
    const left = parseDateValue(row?.subscription_initial_date)?.getTime() ?? 0;
    const right = parseDateValue(newest?.subscription_initial_date)?.getTime() ?? 0;
    return left > right ? row : newest;
  });
};

/**
 * The shape `ModalReturnDeviceFromStaff` has always been handed.
 *
 * Null without a loan or without an identifiable item: a half-built object
 * would have the modal post a lease deletion with no `device_id`.
 */
export const staffReturnDeviceInfo = (lease, item) => {
  if (!lease || !item?.item_id) return null;
  return { ...lease, item_id_info: item };
};
