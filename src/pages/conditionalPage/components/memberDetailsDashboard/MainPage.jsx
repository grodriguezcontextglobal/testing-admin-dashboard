import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import Breadcrumb from "../../../../components/UX/breadcrumbs/Breadcrumb";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import {
  formatLoanDate,
  ProfileErrorState,
  ProfileShell,
  ProfileSkeleton,
  ProfileStatTiles,
  ProfileTabs,
} from "../../../../components/UX/profile";
import {
  audienceWords,
  getIndustryProfile,
} from "../../../../config/industryProfiles";
import { resolveRoleType } from "../../../../config/roles";
import { onAddMemberInfo, onRemoveMemberInfo } from "../../../../store/slices/memberSlice";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";
import useMemberAssignedDevices from "../../hooks/useMemberAssignedDevices";
import MemberProfileIdentity from "./Header";
import { memberNavTabs } from "./utils/memberNavTabs";

const breadcrumbLinkStyle = {
  textTransform: "none",
  textAlign: "left",
  fontWeight: 600,
  fontSize: "18px",
  fontFamily: "Inter",
  lineHeight: "28px",
  color: "var(--blue-dark-600, #155EEF)",
  cursor: "pointer",
};

const breadcrumbCurrentStyle = {
  ...TextFontsize18LineHeight28,
  textTransform: "none",
};

const MainPage = () => {
  const { user } = useSelector((state) => state.admin);
  /* The company's own word for these people, from the same industriesList entry
     that titles the nav tab. Identifiers stay `member` throughout — routes,
     permissions, query keys and test ids are not read by anyone. */
  const who = audienceWords(user?.companyData?.industry);
  const { id: memberId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const groupName = String(location.state?.referencing || "").replace(/-/g, " ");

  const companyId = user?.sqlInfo?.company_id;

  const memberQuery = useQuery({
    // Keyed by member. Without the id in the key, clicking from one student to
    // the next re-used the previous student's cached record, so the page
    // painted the wrong name — and the wrong guardian's contact details —
    // until the new request landed.
    queryKey: ["memberInfoRetrieveQuery", String(memberId ?? "")],
    queryFn: () =>
      devitrakApi.post("/db_member/consulting-member", {
        member_id: Number(memberId),
        company_id: companyId,
      }),
    enabled: !!memberId && !!companyId,
  });

  const members = memberQuery.data?.data?.members;
  const detailMemberInfo = Array.isArray(members) ? members.at(-1) : members ?? null;

  // Hydrate Redux so deep links (/member/:id/assignment etc.) work without
  // first clicking through the members list.
  useEffect(() => {
    if (detailMemberInfo) dispatch(onAddMemberInfo(detailMemberInfo));
  }, [detailMemberInfo, dispatch]);

  const devicesQuery = useMemberAssignedDevices(memberId, companyId);
  const summary = devicesQuery.summary;

  const roleType = resolveRoleType(user);

  if (!getIndustryProfile(user?.companyData?.industry).audience) {
    return <Navigate to="/" replace />;
  }

  const breadcrumbItems = [
    {
      title: (
        <p
          style={breadcrumbLinkStyle}
          onClick={() => {
            navigate("/members", { state: { referencing: groupName } });
            dispatch(onRemoveMemberInfo());
          }}
        >
          {groupName ? `All ${groupName}` : "All members"}
        </p>
      ),
      link: "/members",
      state: { referencing: groupName },
    },
    {
      title: (
        <p style={breadcrumbCurrentStyle}>
          {detailMemberInfo
            ? `${detailMemberInfo.first_name ?? ""} ${
                detailMemberInfo.last_name ?? ""
              }`.trim()
            : ""}
        </p>
      ),
    },
  ];

  if (memberQuery.isError) {
    return (
      <ProfileShell breadcrumb={<Breadcrumb path={breadcrumbItems} />}>
        <ProfileErrorState
          title={`Couldn't load this ${who.singular}`}
          description={`The ${who.singular} service didn't respond. Nothing was changed.`}
          action={
            <GrayButtonComponent
              title={"Try again"}
              func={() => memberQuery.refetch()}
            />
          }
        />
      </ProfileShell>
    );
  }

  if (!detailMemberInfo) {
    return (
      <ProfileShell breadcrumb={<Breadcrumb path={breadcrumbItems} />}>
        <div style={{ padding: "8px 0" }}>
          <ProfileSkeleton lines={5} />
        </div>
      </ProfileShell>
    );
  }

  const statTiles = [
    {
      label: "Overdue",
      value: summary.overdue,
      tone: summary.overdue > 0 ? "critical" : "neutral",
      sub:
        summary.overdue > 0
          ? `Longest: ${summary.longestOverdueDays} days`
          : "Nothing late",
      testId: "member-stat-overdue",
    },
    {
      label: "Devices out",
      value: summary.out,
      sub: summary.out === 0 ? "Nothing assigned" : null,
      testId: "member-stat-out",
    },
    {
      label: "Due this week",
      value: summary.dueSoon,
      sub:
        summary.dueSoon > 0 && summary.nextDue
          ? `Next in ${summary.nextDue.days} days`
          : null,
      testId: "member-stat-due-soon",
    },
    {
      label: "Next due",
      // The endpoint only returns open leases, so every tile here describes a
      // live loan — no lifetime counts that the payload can't back up.
      value: summary.nextDue ? `${summary.nextDue.days}d` : "—",
      sub: summary.nextDue
        ? formatLoanDate(summary.nextDue.date)
        : "Nothing scheduled",
      testId: "member-stat-next-due",
    },
  ];

  const visibleTabs = memberNavTabs(roleType);

  return (
    <ProfileShell
      breadcrumb={<Breadcrumb path={breadcrumbItems} />}
      identity={
        <MemberProfileIdentity
          detailMemberInfo={detailMemberInfo}
          deviceSummary={summary}
        />
      }
      stats={<ProfileStatTiles tiles={statTiles} testId="member-stats" />}
      tabs={<ProfileTabs items={visibleTabs} />}
    >
      <Outlet />
    </ProfileShell>
  );
};

export default MainPage;
