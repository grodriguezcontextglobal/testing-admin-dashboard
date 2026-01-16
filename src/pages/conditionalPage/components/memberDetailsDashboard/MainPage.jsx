import { useSelector } from "react-redux";
import { RectanglePlusIcon } from "../../../../components/icons/RectanglePlusIcon";
import { UpdateIcon } from "../../../../components/icons/UpdateIcon";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import LightBlueButtonComponent from "../../../../components/UX/buttons/LigthBlueButton";
// import { ChangeRoleStaffIcon } from "../../../../components/icons/ChangeRoleStaffIcon";
// import { UpdatePasswordIcon } from "../../../../components/icons/UpdatePasswordIcon";
import { Grid } from "@mui/material";
import { Divider } from "antd";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import Home from "../../../../components/icons/Home";
import MemberInfoHeader from "./Header";
import { EmailIcon } from "../../../../components/icons/EmailIcon";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { devitrakApi } from "../../../../api/devitrakApi";

const MainPage = () => {
  const { user } = useSelector((state) => state.admin);
  const location = useLocation();
  const slug = location.pathname.split("/").filter(Boolean).at(-2);
  const titleParams = String(slug || "").replace(/-/g, " ");
  const groupNameReference = location.state?.referencing || "";
  const groupNameParams = String(groupNameReference || "").replace(/-/g, " ");
  const [membersData, setMembersData] = useState(null);
  const memberInfoRetrieveQuery = useQuery({
    queryKey: ["memberInfoRetrieveQuery"],
    queryFn: () =>
      devitrakApi.post("/db_member/consulting-member", {
        member_id: Number(slug),
      }),
    enabled: !!slug,
  });

  useEffect(() => {
    if (memberInfoRetrieveQuery?.data?.data?.members) {
      setMembersData(memberInfoRetrieveQuery?.data?.data?.members);
    }
  }, [memberInfoRetrieveQuery.data]);

  const tabOptions = [
    {
      label: "Home",
      route: "main",
      permission: [0, 1],
      disabled: false,
      id: 0,
      fn: () => null,
      html: (
        <BlueButtonComponent
          title={"Home"}
          func={() => null}
          icon={<Home width={20} height={20} />}
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
      label: "Update member info",
      route: "update-member-information",
      permission: [0, 1],
      disabled: false,
      id: 1,
      fn: () => null,
      html: (
        <LightBlueButtonComponent
          title={"Update member info"}
          func={() => null}
          icon={<UpdateIcon stroke={"#0040c1"} />}
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
      label: "Reminders",
      route: "reminders",
      permission: [0, 1, 2, 3, 4],
      disabled: user.email !== membersData?.email,
      id: 2,
      fn: () => null,
      html: (
        <GrayButtonComponent
          title={"Reminders"}
          func={() => null}
          icon={
            <EmailIcon width={20} height={20} hoverFill={"var(--basewhite)"} />
          }
          buttonType="button"
          titleStyles={{
            textTransform: "none",
            with: "100%",
            gap: "2px",
          }}
        />
      ),
    },
    // {
    //   label: "Change role",
    //   route: "update-role-company",
    //   permission: [0, 1],
    //   disabled: false,
    //   id: 3,
    //   fn: () => null,
    //   html: (
    //     <GrayButtonComponent
    //       title={"Change role"}
    //       func={() => null}
    //       icon={<ChangeRoleStaffIcon />}
    //       buttonType="button"
    //       titleStyles={{
    //         textTransform: "none",
    //         with: "100%",
    //         gap: "2px",
    //       }}
    //     />
    //   ),
    // },
    // {
    //   label: "Send password reset email",
    //   route: "reset-password-link",
    //   permission: [0, 1, 2, 3, 4],
    //   disabled: false,
    //   id: 4,
    //   fn: () => null,
    //   html: (
    //     <GrayButtonComponent
    //       title={"Send password reset email"}
    //       func={() => null}
    //       icon={<UpdatePasswordIcon />}
    //       buttonType="button"
    //       titleStyles={{
    //         textTransform: "none",
    //         with: "100%",
    //         gap: "2px",
    //       }}
    //     />
    //   ),
    // },
    // {
    //   label: `${profile.active ? "Remove" : "Grant"} access`,
    //   route: `/staff/main`,
    //   permission: [0, 1, 2],
    //   disabled: false,
    //   id: 5,
    //   fn: () => null,
    //   html: (
    //     <GrayButtonComponent
    //       title={`${profile.active ? "Remove" : "Grant"} access`}
    //       func={() => null}
    //       icon={<UpdatePasswordIcon />}
    //       buttonType="button"
    //       titleStyles={{
    //         textTransform: "none",
    //         with: "100%",
    //         gap: "2px",
    //       }}
    //     />
    //   ),
    // },
  ];
  return (
    <>
      <MemberInfoHeader title={titleParams} memberInfo={membersData} groupName={groupNameParams} />
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

export default MainPage;
