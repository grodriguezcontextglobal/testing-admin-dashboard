import { useDispatch, useSelector } from "react-redux";
import { hasPermission, resolveRoleType } from "../../../../config/roles";
import { onAddMemberInfo } from "../../../../store/slices/memberSlice";
import { getIndustryProfile } from "../../../../config/industryProfiles";
import { useQuery } from "@tanstack/react-query";
import { Divider } from "antd";
import { useState } from "react";
import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import AddNewMember from "../modals/AddNewMember";
import MemberInfoHeader from "./Header";

// Untitled UI segmented tab item (active lifts to white with shadow)
const pillNavLinkStyle = ({ isActive }) => ({
  borderRadius: "var(--radius-sm, 6px)",
  padding: "8px 12px",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  whiteSpace: "nowrap",
  textDecoration: "none",
  backgroundColor: isActive ? "var(--base-white, #fff)" : "transparent",
  color: isActive ? "var(--gray-700, #484d47)" : "var(--gray-500, #777b73)",
  boxShadow: isActive ? "var(--shadow-sm)" : "none",
  transition: "background-color 0.12s ease, color 0.12s ease, box-shadow 0.12s ease",
});

const MainPage = () => {
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
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
        company_id: user?.sqlInfo?.company_id,
      }),
    enabled: !!slug && !!user?.sqlInfo?.company_id,
    onSuccess: (data) => {
      if (data?.data?.members) {
        setMembersData(data?.data?.members);
        // Hydrate Redux so deep links (/member/:id/assignment etc.) work
        // without first clicking through the members list.
        const member = Array.isArray(data.data.members)
          ? data.data.members.at(-1)
          : data.data.members;
        if (member) dispatch(onAddMemberInfo(member));
      }
    },
  });

  if (!getIndustryProfile(user?.companyData?.industry).audience) {
    return <Navigate to="/" replace />;
  }

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
            border: "1px solid var(--gray-200, #ddded6)",
            borderRadius: "var(--radius-md, 8px)",
            padding: "4px",
            backgroundColor: "var(--gray-50, #f7f7f4)",
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
