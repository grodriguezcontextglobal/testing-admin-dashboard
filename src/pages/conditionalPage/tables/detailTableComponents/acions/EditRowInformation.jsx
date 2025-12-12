import { devitrakApi } from "../../../../../api/devitrakApi";
import { message } from "antd";
import { formatDate } from "../../../../../components/utils/dateFormat";

/**
 * Update expected return date for a member lease row.
 * @param {Object} record Row record containing identifiers
 * @param {string} dateString Date string from AntD DatePicker (YYYY-MM-DD)
 */
export const updateExpectedReturnDate = async ({
  updateInfo,
  setUpdateInfo,
  queryClient,
}) => {
  if (!updateInfo || !updateInfo.record) return;
  try {
    // Use the newly selected date from updateInfo.expected_return_date
    const newDate = updateInfo?.expected_return_date
      ? new Date(updateInfo.expected_return_date)
      : null;

    if (!newDate || Number.isNaN(newDate.getTime())) {
      return message.error("Please select a valid expected return date.");
    }

    // Build payload according to server expectations:
    // - Provide filters under `where`
    // - Provide columns to change under `update` (do NOT include filter keys)
    const payload = {
      where: {
        member_id: updateInfo.record.member_id,
        staff_member_id: updateInfo.record.staff_member_id,
        device_id: updateInfo.record.device_id,
        company_id: updateInfo.record.company_id,
        // Optional contextual filters if needed (avoid including expected_return_date here)
        // assigned_date: updateInfo.record.assigned_date,
        // location: updateInfo.record.location,
      },
      update: {
        expected_return_date: String(formatDate(newDate)),
      },
    };

    const resp = await devitrakApi.post(
      "/db_member/update-member-assigned-device-lease",
      payload
    );

    if (resp?.data?.ok) {
      setUpdateInfo({});
      // Use provided refetch (function) if available, otherwise rely on query invalidation
      if (queryClient) {
        queryClient.invalidateQueries({
          queryKey: ["devicesAssignedActive"],
          refetchActive: true,
        });
      }
      return message.success("Expected return date updated");
    } else {
      return message.error("Failed to update expected return date");
    }
  } catch (err) {
    return message.error("Error updating expected return date");
  }
};
