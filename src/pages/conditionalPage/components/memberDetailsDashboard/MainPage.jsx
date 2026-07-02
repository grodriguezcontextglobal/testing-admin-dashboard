import { useSelector } from "react-redux";
import { hasPermission, resolveRoleType } from "../../../../config/roles";
import { useQuery } from "@tanstack/react-query";
import { Divider } from "antd";
import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import AddNewMember from "../modals/AddNewMember";
import MemberInfoHeader from "./Header";

const pillNavLinkStyle = ({ isActive }) => ({
  borderRadius: "9999px",
  padding: "6px 14px",
  fontSize: "13px",
  fontWeight: isActive ? 500 : 400,
  lineHeight: "1.4",
  whiteSpace: "nowrap",
  textDecoration: "none",
  backgroundColor: isActive ? "#344054" : "transparent",
  color: isActive ? "#fff" : "#475467",
  transition: "background-color 0.15s, color 0.15s",
});

const MainPage = () => {
  const { user } = useSelector((state) => state.admin);
  const location = useLocation();
  const slug = location.pathname.split("/").filter(Boolean)?.at(-2);
  const titleParams = String(slug || "").replace(/-/g, " ");
  const groupNameReference = location.state?.referencing || "";
  const groupNameParams = String(groupNameReference || "").replace(/-/g, " ");
  const [membersData, setMembersData] = useState(null);
  const [addingNewmember, setAddingNewMember] = useState(false);

  useQuery({
    queryKey: ["memberInfoRetrieveQuery"],
    queryFn: () =>
      devitrakApi.post("/db_member/consulting-member", {
        member_id: Number(slug),
      }),
    enabled: !!slug,
    onSuccess: (data) => {
      if (data?.data?.members) {
        setMembersData(data?.data?.members);
      }
    },
  });

  const navTabs = [
    { label: "Home",                route: "main",                       permission: "nav:members",            id: 0 },
    { label: "Assign devices",      route: "assignment",                 permission: "member:assign_devices",  id: 1 },
    { label: "Update member info",  route: "update-member-information",  permission: "member:update",          id: 2 },
    { label: "Send email reminder", route: "reminders",                  permission: "member:notify",          id: 3 },
  ];

  const roleType = resolveRoleType(user);
  const visibleNavTabs = navTabs.filter(
    (t) => hasPermission(t.permission, roleType)
  );

  return (
    <>
      <MemberInfoHeader title={titleParams} memberInfo={membersData} groupName={groupNameParams} setAddingNewMember={setAddingNewMember} />
      <nav
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
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
            border: "1px solid #D0D5DD",
            borderRadius: "9999px",
            padding: "4px",
            backgroundColor: "#fff",
            width: "fit-content",
          }}
        >
          {visibleNavTabs.map((tab) => (
            <NavLink key={tab.id} to={tab.route} style={pillNavLinkStyle}>
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <Divider />
      <Outlet />
      {AddNewMember && (
        <AddNewMember
          openModal={addingNewmember}
          setOpenModal={setAddingNewMember}
        />
      )}
    </>
  );
};

export default MainPage;
