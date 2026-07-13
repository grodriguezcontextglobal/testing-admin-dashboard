import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Divider, notification } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, Outlet } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { PERMISSIONS } from "../../../config/roles";
import { onAddStaffProfile } from "../../../store/slices/staffDetailSlide";
import { updateStaffMemberInList } from "../../../utils/staffUtils";
import HeaderStaffDetail from "./components/HeaderStaffDetal";

const StaffDetail = () => {
  const { profile } = useSelector((state) => state.staffDetail);
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const updateStaffStatusMutation = useMutation({
    mutationFn: async () => {
      // Use reusable utility to create updated list
      const updatedEmployeesList = updateStaffMemberInList(
        profile.companyData.employees,
        { user: profile.email, active: !profile.status },
      );
      const respoCompany = await devitrakApi.patch(
        `/company/update-company/${profile.companyData.id}`,
        {
          employees: updatedEmployeesList,
        },
      );

      return respoCompany.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["listOfAdminUsers"],
        exact: true,
      });
      queryClient.invalidateQueries({
        queryKey: ["employeesPerCompanyLis"],
        exact: true,
      });
      queryClient.invalidateQueries({
        queryKey: ["events"],
        exact: true,
      });
      dispatch(
        onAddStaffProfile({
          ...profile,
          active: !profile.status,
          status: !profile.status,
          companyData: data.company,
        }),
      );
      notification.success({
        message: "Success",
        description: `Staff access ${!profile.status ? "granted" : "removed"} successfully.`,
      });
    },
    onError: (error) => {
      notification.error({
        message: "Error",
        description:
          error?.response?.data?.msg || "Failed to update staff status.",
      });
    },
  });

  const activeOrDesactiveStaffMemberInCompany = () => {
    updateStaffStatusMutation.mutate();
  };

  const navTabs = [
    { label: "Assign devices", route: "assignment", permission: "staff:assign_devices", disabled: false, id: 0 },
    { label: "Assign user to event", route: "assign-staff-events", permission: "staff:assign_event", disabled: false, id: 1 },
    { label: "Assign Location/Permission", route: "assign-location-manager", permission: "staff:assign_location", disabled: user.email === profile.email, id: 7 },
    { label: "Update contact info", route: "update-contact-info", permission: "staff:update_contact", disabled: user.email !== profile.email, id: 2 },
    { label: "Change role", route: "update-role-company", permission: "staff:change_role", disabled: user.email === profile.email, id: 3 },
    { label: "Send password reset email", route: "reset-password-link", permission: "staff:reset_password", disabled: false, id: 4 },
  ];

  const visibleNavTabs = navTabs.filter(
    (t) => PERMISSIONS[t.permission]?.includes(Number(user.role)) && !t.disabled,
  );

  const showAccessToggle =
    PERMISSIONS["staff:grant_access"]?.includes(Number(user.role)) &&
    user.email !== profile.email;

  const pillNavLinkStyle = ({ isActive }) => ({
    borderRadius: "var(--radius-sm, 6px)",
    padding: "8px 12px",
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: "1.4",
    whiteSpace: "nowrap",
    textDecoration: "none",
    backgroundColor: isActive ? "var(--base-white, #fff)" : "transparent",
    color: isActive
      ? "var(--gray-700, #484d47)"
      : "var(--gray-500, #777b73)",
    boxShadow: isActive ? "var(--shadow-sm)" : "none",
    transition: "background-color 0.15s, color 0.15s, box-shadow 0.15s",
  });

  return (
    <>
      <HeaderStaffDetail />
      <Divider />
      <nav
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          margin: "16px 0",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "2px",
            border: "1px solid var(--gray-200, #ddded6)",
            borderRadius: "var(--radius-md, 8px)",
            padding: "4px",
            backgroundColor: "var(--gray-50, #f7f7f4)",
            width: "fit-content",
          }}
        >
          <NavLink to="." end style={pillNavLinkStyle}>
            Home
          </NavLink>
          {visibleNavTabs.map((tab) => (
            <NavLink key={tab.id} to={tab.route} style={pillNavLinkStyle}>
              {tab.label}
            </NavLink>
          ))}
        </div>

        {showAccessToggle && (
          <NavLink
            to={`/staff/${profile.adminUserInfo.id}/main`}
            onClick={activeOrDesactiveStaffMemberInCompany}
            style={{
              display: "inline-flex",
              alignItems: "center",
              borderRadius: "9999px",
              padding: "8px 18px",
              fontSize: "13px",
              fontWeight: 500,
              lineHeight: "1.4",
              whiteSpace: "nowrap",
              textDecoration: "none",
              border: profile.active
                ? "1px solid var(--error-200, #fecdca)"
                : "1px solid var(--success-300, #75e0a7)",
              backgroundColor: profile.active
                ? "var(--error-50, #fef3f2)"
                : "var(--success-50, #ecfdf3)",
              color: profile.active
                ? "var(--error-700, #b42318)"
                : "var(--success-700, #067647)",
              opacity: updateStaffStatusMutation.isPending ? 0.6 : 1,
              pointerEvents: updateStaffStatusMutation.isPending ? "none" : "auto",
              transition: "opacity 0.15s",
            }}
          >
            {updateStaffStatusMutation.isPending
              ? "Updating..."
              : `${profile.active ? "Remove" : "Grant"} access`}
          </NavLink>
        )}
      </nav>
      <Divider />
      <Outlet />
    </>
  );
};

export default StaffDetail;
