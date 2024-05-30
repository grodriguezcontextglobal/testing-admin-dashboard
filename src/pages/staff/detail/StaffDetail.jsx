import { Grid, Typography } from "@mui/material";
import { NavLink, Outlet } from "react-router-dom";
import HeaderStaffDetail from "./components/HeaderStaffDetal";
import { ChangeRoleStaffIcon, RectanglePlusIcon, UpdateIcon, UpdatePasswordIcon, WhiteCalendarIcon } from "../../../components/icons/Icons";
import { Divider } from "antd";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { LightBlueButton } from "../../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../../styles/global/LightBlueButtonText";
import { GrayButton } from "../../../styles/global/GrayButton";
import GrayButtonText from "../../../styles/global/GrayButtonText";
import { useSelector } from "react-redux";
const StaffDetail = () => {
  const { profile } = useSelector((state) => state.staffDetail);
  const { user } = useSelector((state) => state.admin);

  const tabOptions = [
    {
      label: "Assign devices",
      route: "assignment",
      permission: [0,1],
      disabled: false
    },
    {
      label: "Assign to event",
      route: "assign-staff-events",
      permission: [0,1],
      disabled: false
    },
    {
      label: "Update contact info",
      route: "update-contact-info",
      permission: [0,1,2,3,4],
      disabled: user.email !== profile.email
    },
    {
      label: "Change role",
      route: "update-role-company",
      permission: [0,1],
      disabled: false
    },
    {
      label: "Send password reset email",
      route: "reset-password-link",
      permission: [0,1,2,3,4],
      disabled: false
    },
  ]
  const dicIcons = {
    "Assign devices": <RectanglePlusIcon />,
    "Assign to event": <WhiteCalendarIcon />,
    "Update contact info": <UpdateIcon />,
    "Change role": <ChangeRoleStaffIcon />,
    "Send password reset email": <UpdatePasswordIcon />,
  }
  return (
    <>
      <HeaderStaffDetail />
      <Divider />
      <Grid
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        marginY={3}
        container
      >
        <Grid marginY={0} item xs={12} sm={12} md={12}>
          <nav style={{ display: "flex", width: "100%", gap: "24px" }}>
            {
              tabOptions.map((option, index) => {
                if (index === 0) {
                  return (
                    <NavLink key={option.label} to={`${option.route}`} style={{ ...BlueButton, display: `${option.permission.some(element => element === Number(user.role)) ? 'flex' : "none"}`, justifyContent: "space-between", alignItems: "center", padding: "10x 16px", gap: "8px" }}>
                      <p
                        style={{ ...BlueButtonText, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px" }}
                      >
                        {dicIcons[option.label]}&nbsp;{option.label}
                      </p>
                    </NavLink>
                  )
                } else if (index === 1) {
                  return (
                    <NavLink key={option.label} to={`${option.route}`} style={LightBlueButton}>
                      <p
                        style={{ ...LightBlueButtonText, display: `${option.permission.some(element => element === Number(user.role)) ? 'flex' : "none"}`, justifyContent: "space-between", alignItems: "center", padding: "10px 16px" }}
                      >
                        {dicIcons[option.label]}&nbsp;{option.label}
                      </p>
                    </NavLink>
                  )
                }

                return (
                  <NavLink key={option.label} to={`${option.route}`} style={{ ...GrayButton, display: `${index === 2 && (user.email !== profile.user) ? "none" : "flex"}`, justifyContent: "space-between", alignItems: "center", padding: "10x 16px", gap: "8px" }}>
                    <Typography
                      style={{ ...GrayButtonText, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px" }}
                    >
                      {dicIcons[option.label]}&nbsp;{option.label}
                    </Typography>
                  </NavLink>
                )
              })
            }
          </nav>
          <Divider />
        </Grid>
      </Grid>
      <Outlet />
    </>
  )
};

export default StaffDetail;
