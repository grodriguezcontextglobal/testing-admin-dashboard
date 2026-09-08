/**
 * Pure payload builders for ModalReturnDeviceFromStaff. Dates are injected as
 * arguments (not read from `new Date()` here) so the builders stay pure and
 * unit-testable; the component formats the dates and passes them in.
 */

import { conditionValues } from "../../../../../../utils/returnConditions";

/**
 * Re-exported, not redeclared.
 *
 * This module used to hold its own copy of the five conditions. The member
 * return modal held an identical one, and both send the value verbatim as
 * `status` to /db_event/returning-item -- two lists of the same server
 * contract in two folders, which is how one ends up a word behind the other.
 * The list lives in src/utils/returnConditions.js now, with the descriptions
 * the product review asked for.
 */
export const RETURN_REASONS = conditionValues();

export const isReasonValid = (reason) => `${reason ?? ""}`.trim().length > 0;

/** POST /db_event/returning-item */
export const buildReturningItemPayload = (deviceInfo, user, reason, updatedAt) => ({
  warehouse: 1,
  status: reason,
  update_at: updatedAt,
  serial_number: deviceInfo.item_id_info.serial_number,
  category_name: deviceInfo.item_id_info.category_name,
  item_group: deviceInfo.item_id_info.item_group,
  company_id: user.sqlInfo.company_id,
});

/** POST /db_lease/update-lease-info */
export const buildUpdateLeasePayload = (deviceInfo, { initialDate, returnedDate }) => ({
  subscription_returned_date: returnedDate,
  staff_admin_id: deviceInfo.staff_admin_id,
  company_id: deviceInfo.company_id,
  subscription_current_in_use: 0,
  staff_member_id: deviceInfo.staff_member_id,
  device_id: deviceInfo.item_id_info.item_id,
  active: 0,
  subscription_initial_date: initialDate,
});

/** POST /db_lease/delete-lease-info */
export const buildDeleteLeasePayload = (deviceInfo) => ({
  company_id: deviceInfo.company_id,
  staff_member_id: deviceInfo.staff_member_id,
  device_id: deviceInfo.item_id_info.item_id,
});

/**
 * Every query `useStaffEquipmentData` opens, by root key.
 *
 * Returning a device has to put the staff profile's table back in touch with
 * reality, and the table reads `assignedEquipmentStaff` — which the return
 * modal never invalidated. The three keys it did invalidate were no-ops
 * anyway: they were passed with `exact: true` against a one-element key, while
 * every real key here carries a second element (an email, a company id, the
 * staff record itself).
 *
 * Root keys only, deliberately. Invalidating without `exact` matches by prefix,
 * so this list does not need the email or the company id that the modal has no
 * business knowing. If an entry here ever becomes an array, the bug is back.
 */
export const STAFF_EQUIPMENT_QUERY_KEYS = [
  "staffMemberInfo",
  "imagePerItemList",
  "ItemsInventoryCheckingQuery",
  "assignedEquipmentStaff",
];

/**
 * Refetch the staff equipment views after a return.
 *
 * @param {object} queryClient react-query's client
 */
export const refreshStaffEquipmentQueries = (queryClient) => {
  for (const key of STAFF_EQUIPMENT_QUERY_KEYS) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
};
