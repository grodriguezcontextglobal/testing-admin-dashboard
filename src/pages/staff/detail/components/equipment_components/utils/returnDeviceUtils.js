/**
 * Pure payload builders for ModalReturnDeviceFromStaff. Dates are injected as
 * arguments (not read from `new Date()` here) so the builders stay pure and
 * unit-testable; the component formats the dates and passes them in.
 */

export const RETURN_REASONS = [
  "Operational",
  "Network",
  "Hardware",
  "Damaged",
  "Battery",
];

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
