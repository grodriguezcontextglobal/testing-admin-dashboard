import { Grid, Typography } from "@mui/material";
import { Button, Divider } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { DangerButton } from "../../styles/global/DangerButton";
import { DangerButtonText } from "../../styles/global/DangerButtonText";
import { devitrakApi } from "../../api/devitrakApi";
import { persistor } from "../../store/Store";
import { onResetArticleEdited } from "../../store/slices/articleSlide";
import { onResetCustomer } from "../../store/slices/customerSlice";
import {
  onResetDeviceInQuickGlance,
  onResetDevicesHandle,
} from "../../store/slices/devicesHandleSlice";
import { onResetEventInfo } from "../../store/slices/eventSlice";
import { onResetStaffProfile } from "../../store/slices/staffDetailSlide";
import { onResetHelpers } from "../../store/slices/helperSlice";
import { onResetStripesInfo } from "../../store/slices/stripeSlice";
import { onResetSubscriptionInfo } from "../../store/slices/subscriptionSlice";
import { onLogout } from "../../store/slices/adminSlice";

const MainProfileSettings = () => {
  const { user } = useSelector((state) => state.admin);
  const location = useLocation();
  const dispatch = useDispatch();
  const logout = async () => {
    await devitrakApi.patch(`/staff/edit-admin/${user.uid}`, {
      online: false,
    });
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
    return;
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

  ];
  return (
    <Grid
      style={{
        padding: "5px",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}
      container
    >
      <Grid
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        marginTop={5}
        container
      >
        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          item
          xs={12}
          sm={12}
          md={6}
        >
          <Typography
            textTransform={"none"}
            style={{
              color: "var(--gray-900, #101828)",
              lineHeight: "38px",
            }}
            textAlign={"left"}
            fontWeight={600}
            fontFamily={"Inter"}
            fontSize={"30px"}
          >
            Settings
          </Typography>
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          item
          xs={12}
          sm={12}
          md={6}
        >
          <Button style={DangerButton} onClick={() => logout()}>
            <p style={DangerButtonText}>Log out</p>
          </Button>
        </Grid>
      </Grid>
      <Grid
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        marginTop={1}
        container
      >
        <Grid marginY={0} item xs={12} sm={12} md={12}>
          <nav style={{ display: "flex", gap:"16px" }}>
            {tabOptions.map((option) => {
              if (
                option.permission.some(
                  (element) => element === Number(user.role)
                )
              ) {
                return (
                  <NavLink
                    key={option.label}
                    to={`${option.route}`}
                    style={({ isActive }) => {
                      return {
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "1px 4px 11px",
                        gap: "8px",
                        borderBottom: isActive
                          ? "1px solid #004EEB"
                          : "rgba(0, 0, 0, 0.88)",
                      };
                    }}
                  >
                    <Typography
                      color={`${
                        location.pathname === `/profile/${option.route}`
                          ? "#004EEB"
                          : "#667085"
                      }`}
                      fontFamily={"Inter"}
                      fontSize={"14px"}
                      fontWeight={600}
                      lineHeight={"20px"}
                    >
                      {option.label}
                    </Typography>
                  </NavLink>
                );
              }
            })}
          </nav>
        </Grid>
      </Grid>
      <Divider
        style={{
          margin: 0,
        }}
      />
      <Grid container>
        <Grid
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          item
          xs={12}
        >
          <Outlet />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default MainProfileSettings;
