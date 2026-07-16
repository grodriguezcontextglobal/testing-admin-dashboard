import { Grid } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, Outlet } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import { clearSessionStorage } from "../../api/sessionHeaders";
import DangerButtonComponent from "../../components/UX/buttons/DangerButton";
import { persistor } from "../../store/Store";
import { onLogout } from "../../store/slices/adminSlice";
import { onResetArticleEdited } from "../../store/slices/articleSlide";
import { onResetBackgroundJobs } from "../../store/slices/backgroundJobsSlice";
import { onResetCustomer } from "../../store/slices/customerSlice";
import {
  onResetDeviceInQuickGlance,
  onResetDevicesHandle,
} from "../../store/slices/devicesHandleSlice";
import { onResetEventInfo } from "../../store/slices/eventSlice";
import { onResetHelpers } from "../../store/slices/helperSlice";
import { onResetStaffProfile } from "../../store/slices/staffDetailSlide";
import { onResetStripesInfo } from "../../store/slices/stripeSlice";
import { onResetSubscriptionInfo } from "../../store/slices/subscriptionSlice";
import { hasPermission } from "../../config/roles";
import { useStaffRoleAndLocations } from "../../utils/checkStaffRoleAndLocations";
import MainHeaders from "./ui/MainHeaders";

const MainProfileSettings = () => {
  const { user } = useSelector((state) => state.admin);
  const { isSuperUser } = useStaffRoleAndLocations();
  const dispatch = useDispatch();
  const logout = async () => {
    try {
      await devitrakApi.patch(`/staff/edit-admin/${user.uid}`, {
        online: false,
      });
      await devitrakApi.post("/admin/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Client-side cleanup
      persistor.purge();
      dispatch(onResetArticleEdited());
      dispatch(onResetCustomer());
      dispatch(onResetDevicesHandle());
      dispatch(onResetDeviceInQuickGlance());
      dispatch(onResetEventInfo());
      dispatch(onResetStaffProfile());
      dispatch(onResetHelpers());
      dispatch(onResetBackgroundJobs());
      dispatch(onResetStripesInfo());
      dispatch(onResetSubscriptionInfo());
      clearSessionStorage();
      dispatch(onLogout());
    }
  };
  const tabOptions = [
    { label: "My details",      route: "my_details",               permission: "nav:profile"            },
    { label: "Password",        route: "password",                 permission: "nav:profile"            },
    { label: "MFA Setup",       route: "mfa-setup",                permission: "nav:profile"            },
    { label: "Notifications",   route: "notifications",            permission: "profile:staff_settings" },
    { label: "Company info",    route: "company-info",             permission: "profile:company_settings"},
    { label: "Stripe account",  route: "stripe_connected_account", permission: "profile:billing"        },
    { label: "Documents",       route: "documents",                permission: "profile:staff_settings" },
    { label: "Suppliers",       route: "providers",                permission: "profile:staff_settings" },
    { label: "Platform policies",route: "platform_policies",       permission: "nav:profile"            },
    { label: "System Jobs",      route: "system-jobs",              requiresSuperUser: true              },
  ];
  // Untitled UI segmented tabs ("button white" style): gray-50 rail,
  // active tab lifts to white with shadow-sm.
  const pillStyle = {
    border: "none",
    background: "transparent",
    borderRadius: "var(--radius-sm, 6px)",
    padding: "8px 12px",
    fontSize: "14px",
    lineHeight: "20px",
    color: "var(--gray-500, #777b73)",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    transition: "background 0.12s ease, color 0.12s ease, box-shadow 0.12s ease",
  };

  const pillActiveStyle = {
    background: "var(--base-white, #fff)",
    color: "var(--gray-700, #484d47)",
    boxShadow: "var(--shadow-sm)",
  };

  const optionsNavOut = () => {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "4px",
          border: "1px solid var(--gray-200, #ddded6)",
          borderRadius: "var(--radius-md, 8px)",
          padding: "4px",
          backgroundColor: "var(--gray-50, #f7f7f4)",
          width: "fit-content",
        }}
      >
        {tabOptions.map((option) => {
          const isAllowed = option.requiresSuperUser
            ? isSuperUser
            : hasPermission(option.permission, user.roleType);
          if (isAllowed) {
            return (
              <NavLink
                key={option.label}
                to={`${option.route}`}
                style={({ isActive }) => ({
                  ...pillStyle,
                  ...(isActive ? pillActiveStyle : {}),
                })}
              >
                {option.label}
              </NavLink>
            );
          }
        })}
      </div>
    );
  };
  return (
    <Grid
      container
      sx={{
        maxWidth: "1400px",
      }}
    >
      <MainHeaders
        user={{
          name: `${user?.name ?? ""} ${user?.lastName ?? ""}`.trim(),
          email: user?.email,
          avatarUrl:
            user?.data?.imageProfile ||
            `${user?.name?.[0] ?? ""}.${user?.lastName?.[0] ?? ""}`,
        }}
        showSearch={false}
        showMoreOptions={true}
        moreOptionsRendering={optionsNavOut}
        actions={{
          desktop: [
            <DangerButtonComponent
              title="Log out"
              key="logout"
              buttonType="button"
              func={() => logout()}
            />,
          ],
          mobile: [
            <DangerButtonComponent
              title="Log out"
              key="logout"
              buttonType="button"
              func={() => logout()}
            />,
          ],
        }}
      />

      <Grid
        container
        // sx={{
        //   marginTop: { xs: 2, sm: 3 },
        //   padding: { xs: "16px 0", sm: "24px 0" },
        // }}
      >
        <Grid item xs={12} sm={12} md={12} lg={12} sx={{ padding: { xs: "16px 0", sm: "24px 0" } }}>
          <Outlet />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default MainProfileSettings;
