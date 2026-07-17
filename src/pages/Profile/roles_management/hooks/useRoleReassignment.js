import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import { ROLE_LEVELS } from "../../../../config/roles";
import { onLogin } from "../../../../store/slices/adminSlice";
import { extractStaffId } from "../../../authentication/utils/loginUtils";

/**
 * Reassigns a staff member to a different role concept, reusing the canonical
 * 3-call mutation sequence from
 * src/pages/staff/detail/components/equipment_components/UpdateRoleInCompany.jsx:
 *   1. POST  /db_staff/consulting-member  (resolve SQL staff_id by email)
 *   2. PATCH /db_staff/company-staff       (update SQL-side role)
 *   3. PATCH /company/update-company/:id    (sync MongoDB employees array)
 *
 * The board renders FROM Redux (companyData.employees); on success we refresh
 * that via onLogin so the moved member appears in the new column and the old
 * copy disappears. On failure Redux is untouched, so the board self-corrects.
 */
export const useRoleReassignment = () => {
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    // toGroupKey is the legacy role-concept string (e.g. "event_manager"),
    // matching the roleType value UpdateRoleInCompany writes.
    mutationFn: async ({ employee, toGroupKey }) => {
      const newLevel = ROLE_LEVELS[toGroupKey];

      // 1. Fetch staff_id by email from the SQL staff table.
      const staffResponse = await devitrakApi.post(
        "/db_staff/consulting-member",
        { email: employee.user }
      );
      const staff_id = extractStaffId(staffResponse.data);
      if (!staff_id) throw new Error("Staff member not found in SQL database.");

      // 2. Update the SQL company_staff table.
      await devitrakApi.patch("/db_staff/company-staff", {
        company_id: user.sqlInfo.company_id,
        staff_id,
        role_level: newLevel,
        role_type: toGroupKey,
      });

      // 3. Keep the MongoDB employees array in sync.
      const employees = user.companyData.employees ?? [];
      const idx = employees.findIndex((el) => el.user === employee.user);
      const updatedEmployees =
        idx > -1
          ? employees.toSpliced(idx, 1, {
              ...employees[idx],
              role: String(newLevel),
              roleType: toGroupKey,
            })
          : employees;

      return devitrakApi.patch(
        `/company/update-company/${user.companyData.id}`,
        { employees: updatedEmployees }
      );
    },
    onSuccess: (mongoResult) => {
      // Refresh the company payload in Redux so the board re-renders from truth.
      const refreshedCompany =
        mongoResult?.data?.company ?? user.companyData;
      dispatch(
        onLogin({
          ...user,
          companyData: { ...user.companyData, ...refreshedCompany },
        })
      );
      queryClient.invalidateQueries({ queryKey: ["employeesPerCompanyList"] });
      notification.success({
        message: "Staff role updated",
        description: "The member now holds the new role across your company.",
      });
    },
    onError: (error) => {
      notification.error({
        message: "Failed to update role",
        description:
          error?.response?.data?.msg ||
          error?.message ||
          "Please try again.",
      });
    },
  });

  return {
    reassign: mutation.mutate,
    isReassigning: mutation.isLoading,
  };
};

export default useRoleReassignment;
