import { Grid } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Divider } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, Outlet } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { ChangeRoleStaffIcon } from "../../../components/icons/ChangeRoleStaffIcon";
import { RectanglePlusIcon } from "../../../components/icons/RectanglePlusIcon";
import { UpdateIcon } from "../../../components/icons/UpdateIcon";
import { UpdatePasswordIcon } from "../../../components/icons/UpdatePasswordIcon";
import { WhiteCalendarIcon } from "../../../components/icons/WhiteCalendarIcon";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import LightBlueButtonComponent from "../../../components/UX/buttons/LigthBlueButton";
import { onAddStaffProfile } from "../../../store/slices/staffDetailSlide";
import HeaderStaffDetail from "./components/HeaderStaffDetal";
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
      html: (
        <BlueButtonComponent
          title={"Assign devices"}
          func={() => null}
          icon={<RectanglePlusIcon />}
          buttonType="button"
          titleStyles={{
            textTransform: "none",
            with: "100%",
            gap: "2px",
          }}
        />
      ),
    },
    {
      label: "Assign user to event",
      route: "assign-staff-events",
      permission: [0, 1],
      disabled: false,
      id: 1,
      fn: () => null,
      html: (
        <LightBlueButtonComponent
          title={"Assign user to event"}
          func={() => null}
          icon={<WhiteCalendarIcon />}
          buttonType="button"
          titleStyles={{
            textTransform: "none",
            with: "100%",
            gap: "2px",
          }}
        />
      ),
    },
    {
      label: "Update contact info",
      route: "update-contact-info",
      permission: [0, 1, 2, 3, 4],
      disabled: user.email !== profile.email,
      id: 2,
      fn: () => null,
      html: (
        <GrayButtonComponent
          title={"Update contact info"}
          func={() => null}
          icon={<UpdateIcon />}
          buttonType="button"
          titleStyles={{
            textTransform: "none",
            with: "100%",
            gap: "2px",
          }}
        />
      ),
    },
    {
      label: "Change role",
      route: "update-role-company",
      permission: [0, 1],
      disabled: false,
      id: 3,
      fn: () => null,
      html: (
        <GrayButtonComponent
          title={"Change role"}
          func={() => null}
          icon={<ChangeRoleStaffIcon />}
          buttonType="button"
          titleStyles={{
            textTransform: "none",
            with: "100%",
            gap: "2px",
          }}
        />
      ),
    },
    {
      label: "Send password reset email",
      route: "reset-password-link",
      permission: [0, 1, 2, 3, 4],
      disabled: false,
      id: 4,
      fn: () => null,
      html: (
        <GrayButtonComponent
          title={"Send password reset email"}
          func={() => null}
          icon={<UpdatePasswordIcon />}
          buttonType="button"
          titleStyles={{
            textTransform: "none",
            with: "100%",
            gap: "2px",
          }}
        />
      ),
    },
    {
      label: `${profile.active ? "Remove" : "Grant"} access`,
      route: `/staff/${profile.adminUserInfo.id}/main`,
      permission: [0, 1, 2],
      disabled: false,
      id: 5,
      fn: () => activeOrDesactiveStaffMemberInCompany(),
      html: (
        <GrayButtonComponent
          title={`${profile.active ? "Remove" : "Grant"} access`}
          func={() => null}
          icon={<UpdatePasswordIcon />}
          buttonType="button"
          titleStyles={{
            textTransform: "none",
            with: "100%",
            gap: "2px",
          }}
        />
      ),
    },
  ];
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
          {tabOptions.map((option) => {
            return (
              <NavLink
                key={option.label}
                to={`${option.route}`}
                style={{
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
                }}
              >
                {option.html}
              </NavLink>
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
