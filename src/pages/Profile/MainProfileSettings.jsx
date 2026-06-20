import { Grid } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, Outlet } from "react-router-dom";
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
import MainHeaders from "./ui/MainHeaders";
import { rolesWith } from "../../config/roleCapabilities";

const MainProfileSettings = () => {
  const { user } = useSelector((state) => state.admin);
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
      permission: rolesWith("profile.details"),
    },
    {
      label: "Password",
      route: "password",
      permission: rolesWith("profile.password"),
    },
    {
      label: "MFA Setup",
      route: "mfa-setup",
      permission: rolesWith("profile.mfa"),
    },
    // {
    //   label: "Billing",
    //   route: "billing",
    //   permission: [0,1,2]
    // },
    {
      label: "Notifications",
      route: "notifications",
      permission: rolesWith("profile.notifications"),
    },
    // {
    //   label: "Staff activity",
    //   route: "staff-activity",
    //   permission: [0, 1],
    // },
    {
      label: "Company info",
      route: "company-info",
      permission: rolesWith("profile.companyInfo"),
    },
    {
      label: "Stripe account",
      route: "stripe_connected_account",
      permission: rolesWith("profile.stripeAccount"),
    },
    {
      label: "Documents",
      route: "documents",
      permission: rolesWith("profile.documents"), // admin + managers
    },
    {
      label: "Suppliers",
      route: "providers",
      permission: rolesWith("profile.suppliers"), // admin + managers
    },
    {
      label: "Platform policies",
      route: "platform_policies",
      permission: rolesWith("profile.policies"),
    },
  ];
  const pillStyle = {
    border: "none",
    background: "transparent",
    borderRadius: "9999px",
    padding: "6px 14px",
    fontSize: "14px",
    lineHeight: "20px",
    color: "#475467",
    fontWeight: 400,
    cursor: "pointer",
    whiteSpace: "nowrap",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
  };

  const pillActiveStyle = {
    background: "#344054",
    color: "#fff",
    fontWeight: 500,
  };

  const optionsNavOut = () => {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "2px",
          border: "1px solid #D0D5DD",
          borderRadius: "9999px",
          padding: "4px",
          backgroundColor: "#fff",
          width: "fit-content",
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
          name: `${user.name} ${user.lastName}`,
          email: user.email,
          avatarUrl:
            user.data.imageProfile || `${user.name[0]}.${user.lastName[0]}`,
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
