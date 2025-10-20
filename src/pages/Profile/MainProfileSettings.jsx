import { Grid, Typography, useMediaQuery, useTheme } from "@mui/material";
import { Divider } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import DangerButtonComponent from "../../components/UX/buttons/DangerButton";
import { persistor } from "../../store/Store";
import { onLogout } from "../../store/slices/adminSlice";
import { onResetArticleEdited } from "../../store/slices/articleSlide";
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

const MainProfileSettings = () => {
  const { user } = useSelector((state) => state.admin);
  const location = useLocation();
  const dispatch = useDispatch();
  const logout = async () => {
    try {
      await devitrakApi.patch(`/staff/edit-admin/${user.uid}`, { online: false });
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
      dispatch(onResetStripesInfo());
      dispatch(onResetSubscriptionInfo());
      localStorage.removeItem("admin-token", "");
      dispatch(onLogout());
    }
  };
  const tabOptions = [
    {
      label: "My details",
      route: "my_details",
      permission: [0, 1, 2, 3, 4],
    },
    {
      label: "Password",
      route: "password",
      permission: [0, 1, 2, 3, 4],
    },
    // {
    //   label: "Billing",
    //   route: "billing",
    //   permission: [0,1,2]
    // },
    {
      label: "Notifications",
      route: "notifications",
      permission: [0, 1],
    },
    // {
    //   label: "Staff activity",
    //   route: "staff-activity",
    //   permission: [0, 1],
    // },
    {
      label: "Company info",
      route: "company-info",
      permission: [0],
    },
    {
      label: "Stripe account",
      route: "stripe_connected_account",
      permission: [0],
    },
    {
      label: "Documents",
      route: "documents",
      permission: [0, 1], // Allowing access for admin and managers
    },
    {
      label: "Suppliers",
      route: "providers",
      permission: [0, 1], // Allowing access for admin and managers
    },
    {
      label: "Platform policies",
      route: "platform_policies",
      permission: [0, 1, 2, 3, 4],
    },
  ];
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Grid
      container
      spacing={2}
      sx={{
        padding: { xs: "16px", sm: "24px", md: "32px" },
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <Grid
        container
        spacing={{ xs: 2, sm: 3 }}
        sx={{
          marginTop: { xs: 1, sm: 2, md: 3 },
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Grid
          item
          xs={12}
          sm={6}
          sx={{
            display: "flex",
            justifyContent: { xs: "center", sm: "flex-start" },
            alignItems: "center",
          }}
        >
          <Typography
            variant={isMobile ? "h5" : "h4"}
            sx={{
              color: "var(--gray-900, #101828)",
              fontWeight: 600,
              fontFamily: "Inter",
              textAlign: { xs: "center", sm: "left" },
            }}
          >
            Settings
          </Typography>
        </Grid>
        <Grid
          item
          xs={12}
          sm={6}
          sx={{
            display: "flex",
            justifyContent: { xs: "center", sm: "flex-end" },
            alignItems: "center",
          }}
        >
          <DangerButtonComponent
          title={"Log out"}
          func={() => logout()}
          />
        </Grid>
      </Grid>

      <Grid
        item
        xs={12}
        sx={{
          marginTop: { xs: 2, sm: 3 },
          overflowX: "auto",
        }}
      >
        <nav
          style={{
            display: "flex",
            gap: isMobile ? "8px" : "16px",
            minWidth: "min-content",
            padding: isMobile ? "8px 0" : "0",
          }}
        >
          {tabOptions.map((option) => {
            if (
              option.permission.some((element) => element === Number(user.role))
            ) {
              return (
                <NavLink
                  key={option.label}
                  to={`${option.route}`}
                  style={({ isActive }) => ({
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: isMobile ? "4px 8px" : "1px 4px 11px",
                    gap: "8px",
                    borderBottom: isActive
                      ? "1px solid #004EEB"
                      : "rgba(0, 0, 0, 0.88)",
                    whiteSpace: "nowrap",
                  })}
                >
                  <Typography
                    sx={{
                      color: () =>
                        location.pathname === `/profile/${option.route}`
                          ? "#004EEB"
                          : "#667085",
                      fontFamily: "Inter",
                      fontSize: { xs: "12px", sm: "14px" },
                      fontWeight: 600,
                      lineHeight: "20px",
                    }}
                  >
                    {option.label}
                  </Typography>
                </NavLink>
              );
            }
          })}
        </nav>
      </Grid>

      <Divider sx={{ width: "100%", margin: "0" }} />

      <Grid
        container
        sx={{
          marginTop: { xs: 2, sm: 3 },
          padding: { xs: "16px", sm: "24px" },
        }}
      >
        <Grid item xs={12}>
          <Outlet />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default MainProfileSettings;
