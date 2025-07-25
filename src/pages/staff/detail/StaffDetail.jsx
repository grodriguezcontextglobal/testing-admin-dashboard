import { Grid } from "@mui/material";
import { Divider } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, Outlet } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { ChangeRoleStaffIcon } from "../../../components/icons/ChangeRoleStaffIcon";
import { RectanglePlusIcon } from "../../../components/icons/RectanglePlusIcon";
import { UpdateIcon } from "../../../components/icons/UpdateIcon";
import { UpdatePasswordIcon } from "../../../components/icons/UpdatePasswordIcon";
import { WhiteCalendarIcon } from "../../../components/icons/WhiteCalendarIcon";
import { onAddStaffProfile } from "../../../store/slices/staffDetailSlide";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../styles/global/GrayButton";
import GrayButtonText from "../../../styles/global/GrayButtonText";
import { LightBlueButton } from "../../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../../styles/global/LightBlueButtonText";
import HeaderStaffDetail from "./components/HeaderStaffDetal";
import { useQueryClient } from "@tanstack/react-query";
const StaffDetail = () => {
  const { profile } = useSelector((state) => state.staffDetail);
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const activeOrDesactiveStaffMemberInCompany = async () => {
    try {
      const employeesInCompany = [...profile.companyData.employees];
      const foundUserIndex = employeesInCompany.findIndex(
        (element) => element.user === profile.email
      );

      employeesInCompany[foundUserIndex] = {
        ...employeesInCompany[foundUserIndex],
        active: !profile.status,
      };
      const respoCompany = await devitrakApi.patch(
        `/company/update-company/${profile.companyData.id}`,
        {
          employees: employeesInCompany,
        }
      );
      if (respoCompany.data.ok) {
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
            companyData: respoCompany.data.company,
          })
        );
        return;
      }
    } catch (error) {
      return null;
    }
  };

  const tabOptions = [
    {
      label: "Assign devices",
      route: "assignment",
      permission: [0, 1],
      disabled: false,
      id: 0,
      fn: () => null,
    },
    {
      label: "Assign user to event",
      route: "assign-staff-events",
      permission: [0, 1],
      disabled: false,
      id: 1,
      fn: () => null,
    },
    {
      label: "Update contact info",
      route: "update-contact-info",
      permission: [0, 1, 2, 3, 4],
      disabled: user.email !== profile.email,
      id: 2,
      fn: () => null,
    },
    {
      label: "Change role",
      route: "update-role-company",
      permission: [0, 1],
      disabled: false,
      id: 3,
      fn: () => null,
    },
    {
      label: "Send password reset email",
      route: "reset-password-link",
      permission: [0, 1, 2, 3, 4],
      disabled: false,
      id: 4,
      fn: () => null,
    },
    {
      label: `${profile.active ? "Remove" : "Grant"} access`,
      route: `/staff/${profile.adminUserInfo.id}/main`,
      permission: [0, 1, 2],
      disabled: false,
      id: 5,
      fn: () => activeOrDesactiveStaffMemberInCompany(),
    },
  ];
  const dicIcons = {
    "Assign devices": <RectanglePlusIcon />,
    "Assign to event": <WhiteCalendarIcon />,
    "Update contact info": <UpdateIcon />,
    "Change role": <ChangeRoleStaffIcon />,
    "Send password reset email": <UpdatePasswordIcon />,
  };
  return (
    <>
      <HeaderStaffDetail />
      <Divider />
      <nav style={{ display: "flex", width: "100%", gap: "24px", marginY: 3 }}>
        <Grid
          style={{
            display: "flex",
            justifyContent: {
              xs: "flex-start",
              sm: "flex-start",
              md: "space-between",
              lg: "space-between",
            },
            alignSelf: {
              xs: "flex-start",
              sm: "flex-start",
              md: "center",
              lg: "center",
            },
            gap: "24px",
          }}
          container
        >
          {tabOptions.map((option, index) => {
            if (index === 0) {
              return (
                <Grid
                  key={option.label}
                  marginY={0}
                  item
                  xs={12}
                  sm={12}
                  md={2}
                  lg={2}
                >
                  <NavLink
                    key={option.label}
                    to={`${option.route}`}
                    style={{
                      ...BlueButton,
                      display: `${
                        option.permission.some(
                          (element) => element === Number(user.role)
                        )
                          ? "flex"
                          : "none"
                      }`,
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10x 16px",
                      gap: "8px",
                      width: "100%",
                    }}
                  >
                    <p
                      style={{
                        ...BlueButtonText,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 16px",
                      }}
                    >
                      {dicIcons[option.label]}&nbsp;{option.label}
                    </p>
                  </NavLink>
                </Grid>
              );
            } else if (index === 1) {
              return (
                <Grid
                  key={option.label}
                  marginY={0}
                  item
                  xs={12}
                  sm={12}
                  md={2}
                  lg={2}
                >
                  <NavLink to={`${option.route}`} style={{ ...LightBlueButton, width: "100%" }}>
                    <p
                      style={{
                        ...LightBlueButtonText,
                        display: `${
                          option.permission.some(
                            (element) => element === Number(user.role)
                          )
                            ? "flex"
                            : "none"
                        }`,
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "10px 16px",
                        width: "100%",
                      }}
                    >
                      {dicIcons[option.label]}&nbsp;{option.label}
                    </p>
                  </NavLink>
                </Grid>
              );
            }

            return (
              <Grid
                key={option.label}
                display={option.disabled ? "none" : "flex"}
                marginY={0}
                item
                xs={12}
                sm={12}
                md={2}
                lg={option.id === 4 ? 3 : 2}
              >
                <NavLink
                  key={option.label}
                  to={`${option.route}`}
                  style={{
                    ...GrayButton,
                    display: `${
                      (option.id === 2 && user.email !== profile.user) ||
                      (option.id === 5 && user.email === profile.user)
                        ? "none"
                        : "flex"
                    }`,
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10x 16px",
                    gap: "8px",
                    width: "100%",
                  }}
                  onClick={() => option.fn()}
                >
                  <p
                    style={{
                      ...GrayButtonText,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 16px",
                    }}
                  >
                    {dicIcons[option.label]}&nbsp;{option.label}
                  </p>
                </NavLink>
              </Grid>
            );
          })}
        </Grid>
      </nav>
      <Divider />
      <Outlet />
    </>
  );
};

export default StaffDetail;
