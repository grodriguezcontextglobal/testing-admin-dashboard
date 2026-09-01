import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import Breadcrumb from "../../../components/UX/breadcrumbs/Breadcrumb";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import {
  ProfileErrorState,
  ProfileIdentityCard,
  ProfileSection,
  ProfileShell,
  ProfileSkeleton,
  ProfileStatTiles,
  ProfileTabs,
  StatusChip,
} from "../../../components/UX/profile";
import { useStatusNotification } from "../../../components/notification/alerts/useStatusNotification";
import { hasPermission, resolveRoleType } from "../../../config/roles";
import { useRoleLabel } from "../../../hooks/useRoleLabel";
import { onAddStaffProfile, onResetStaffProfile } from "../../../store/slices/staffDetailSlide";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import { updateStaffMemberInList } from "../../../utils/staffUtils";
import EditProfileModal from "./EditProfileModal";
import AssignedDevicesTable from "./components/AssignedDevicesTable";
import StaffEventsTable from "./components/StaffEventsTable";
import StaffProfileActions from "./components/StaffProfileActions";
import { useStaffEquipmentData } from "./components/equipment_components/useStaffEquipmentData";
import {
  activeEventsForStaff,
  deviceRowsForStaff,
  formatMoney,
  staffEventRows,
  summarizeStaffProfile,
} from "./utils/staffProfileSummary";

/**
 * One staff member: who they are, what they are holding, and where they work.
 *
 * Rebuilt on the shared profile shell, the same layout the consumer, member and
 * device profiles use. What it replaces:
 *
 *   - A pill bar of six *verbs* presented as tabs — "Assign devices", "Assign
 *     user to event", "Assign Location/Permission", "Update contact info",
 *     "Change role", "Send password reset email" — beside a "Home" tab that
 *     pointed at `/staff/:id`, a route with no element. Landing on the profile,
 *     or clicking Home, rendered the header and then nothing at all: the
 *     overview only existed at `/staff/:id/main`. The verbs now live in the
 *     identity card's action rail and the profile content is always on screen,
 *     so the action routes open over it instead of replacing it.
 *   - "Grant/Remove access" as a `NavLink` with the mutation on its `onClick`:
 *     it navigated and wrote at the same time, with nothing to confirm.
 *   - An "Add new staff" button at the top of a single person's profile.
 *   - A 30px "Staff" heading — plural, generic — above the name of one person.
 *     The person's name is the page's only <h1> now.
 *   - Two separate walks of the event list with different rules, one for the
 *     header chip and one for the table, and a device table that re-joined
 *     leases to inventory inside four column renderers.
 */

const breadcrumbLinkStyle = {
  ...TextFontsize18LineHeight28,
  color: "var(--blue-dark-600, #155EEF)",
  cursor: "pointer",
};

const breadcrumbCurrentStyle = {
  ...TextFontsize18LineHeight28,
  color: "var(--gray-900, #101828)",
};

// Nouns, and the same first word the member profile uses for the same section
// — "Devices" there, "Assigned devices" here read as two different products.
// The section heading below still says "Assigned devices", which is what a
// heading is for: the tab names the place, the heading describes it.
const TABS = [
  { key: "devices", label: "Devices" },
  { key: "events", label: "Events" },
];

const StaffDetail = () => {
  const { profile } = useSelector((state) => state.staffDetail);
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useStatusNotification();
  const roleLabel = useRoleLabel();

  const [tab, setTab] = useState("devices");
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  const staffId = profile?.adminUserInfo?.id;
  const roleType = resolveRoleType(user);
  const isOwnProfile = user?.email === profile?.email;

  const {
    staffMemberQuery,
    listImagePerItemQuery,
    itemsInInventoryQuery,
    leaseQuery,
    verificationQueries,
  } = useStaffEquipmentData(profile, user);

  const eventsQuery = useQuery({
    queryKey: ["staffProfileEvents", user?.company],
    queryFn: () =>
      devitrakApi.post("/event/event-list", {
        company: user.company,
        type: "event",
      }),
    enabled: Boolean(user?.company),
  });

  const deviceRows = useMemo(
    () =>
      deviceRowsForStaff(
        leaseQuery.data,
        itemsInInventoryQuery.data?.data?.items,
        listImagePerItemQuery.data?.data?.item
      ),
    [leaseQuery.data, itemsInInventoryQuery.data, listImagePerItemQuery.data]
  );

  const eventRows = useMemo(
    () => staffEventRows(eventsQuery.data?.data?.list, profile?.email),
    [eventsQuery.data, profile?.email]
  );

  const activeEvents = useMemo(
    () => activeEventsForStaff(eventsQuery.data?.data?.list, profile?.email),
    [eventsQuery.data, profile?.email]
  );

  // `verificationQueries` comes back in the same order as the leases, so the
  // map is built from that pairing rather than from a second grouping pass.
  const verificationById = useMemo(() => {
    const leases = Array.isArray(leaseQuery.data) ? leaseQuery.data : [];
    return leases.reduce((map, lease, index) => {
      if (lease?.verification_id && verificationQueries[index]) {
        map[lease.verification_id] = verificationQueries[index];
      }
      return map;
    }, {});
  }, [leaseQuery.data, verificationQueries]);

  const signedByVerification = useMemo(
    () =>
      Object.entries(verificationById).reduce((map, [id, query]) => {
        if (query?.data) map[id] = Boolean(query.data.allSigned);
        return map;
      }, {}),
    [verificationById]
  );

  const summary = summarizeStaffProfile({
    deviceRows,
    eventRows,
    signedByVerification,
  });

  const updateStaffStatusMutation = useMutation({
    mutationFn: async () => {
      const updatedEmployeesList = updateStaffMemberInList(
        profile.companyData.employees,
        { user: profile.email, active: !profile.status }
      );
      const respoCompany = await devitrakApi.patch(
        `/company/update-company/${profile.companyData.id}`,
        { employees: updatedEmployeesList }
      );
      return respoCompany.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["listOfAdminUsers"] });
      queryClient.invalidateQueries({
        queryKey: ["employeesPerCompanyList"],
        exact: true,
      });
      queryClient.invalidateQueries({ queryKey: ["events"], exact: true });
      dispatch(
        onAddStaffProfile({
          ...profile,
          active: !profile.status,
          status: !profile.status,
          companyData: data.company,
        })
      );
      notify(
        "success",
        `Access ${!profile.status ? "granted" : "removed"}.`,
        `${profile.firstName ?? "This person"} ${
          !profile.status ? "can now sign in." : "can no longer sign in."
        }`
      );
    },
    onError: (error) => {
      notify(
        "error",
        "Access unchanged",
        error?.response?.data?.msg || "The company record was not updated."
      );
    },
  });

  const breadcrumb = (
    <Breadcrumb
      path={[
        {
          title: <p style={breadcrumbLinkStyle}>All staff</p>,
          onClick: () => {
            // The selection has to be dropped as well as navigated away from:
            // it is what the profile reads, so leaving it set showed the old
            // person for a frame on the way back in.
            dispatch(onResetStaffProfile());
            navigate("/staff");
          },
        },
        {
          title: (
            <p style={breadcrumbCurrentStyle} data-testid="staff-detail-title">
              {[profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
                "Staff member"}
            </p>
          ),
        },
      ]}
    />
  );

  // Arriving after the selection was reset — a reload, or a back navigation
  // after "All staff" — used to throw on `profile.adminUserInfo.id`.
  if (!profile?.email) {
    return (
      <div style={{ padding: "16px 24px 24px" }}>
        <ProfileShell breadcrumb={breadcrumb}>
          <ProfileErrorState
            title="No staff member selected"
            description="Open someone from the staff list to see their profile."
            action={
              <Link to="/staff">
                <GrayButtonComponent title="Back to all staff" />
              </Link>
            }
          />
        </ProfileShell>
      </div>
    );
  }

  const info = profile.adminUserInfo ?? {};
  const fullName =
    [info.name, info.lastName].filter(Boolean).join(" ") ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    profile.email;

  // The role in *this company* (profile.roleType / profile.role), not
  // adminUserInfo.role — the AdminUser document's own field, which is not what
  // a role change writes, so reading it left this stale right after an edit.
  const roleName = roleLabel(profile.roleType || profile.role);

  const canManageDevices = hasPermission("staff:assign_devices", roleType);
  const isLoadingDevices =
    staffMemberQuery.isLoading ||
    leaseQuery.isLoading ||
    itemsInInventoryQuery.isLoading ||
    listImagePerItemQuery.isLoading;
  const devicesFailed =
    staffMemberQuery.isError || leaseQuery.isError || itemsInInventoryQuery.isError;

  const itemIdsForVerification = (verificationId) =>
    deviceRows
      .filter((row) => row.verificationId === verificationId)
      .map((row) => encodeURIComponent(row.deviceId))
      .join(",");

  /** Signing is done by the holder; reviewing a signed contract by an admin. */
  const openDocument = (row, doc, mode) => {
    if (mode === "sign") {
      return navigate(
        `/display-contracts?company_id=${encodeURIComponent(
          user.companyData.id
        )}&contract_url=${encodeURIComponent(
          doc.url
        )}&staff_member_id=${encodeURIComponent(
          staffId
        )}&date_reference=${encodeURIComponent(
          row.assignedAt
        )}&ver_id=${encodeURIComponent(
          row.verificationId
        )}&item_ids=${encodeURIComponent(itemIdsForVerification(row.verificationId))}`
      );
    }

    return navigate(`/staff/${staffId}/view_actions_staff_taken`, {
      state: {
        contract_url: doc.url,
        verificationId: row.verificationId,
        item_ids: row.deviceId,
        company_id: user.companyData.id,
      },
    });
  };

  const retryDevices = () => {
    staffMemberQuery.refetch();
    leaseQuery.refetch();
    itemsInInventoryQuery.refetch();
    listImagePerItemQuery.refetch();
  };

  const section = () => {
    if (tab === "events") {
      if (eventsQuery.isError) {
        return (
          <ProfileErrorState
            title="Couldn't load this person's events"
            description="The service didn't respond. Nothing was changed."
            action={
              <GrayButtonComponent
                title="Try again"
                func={() => eventsQuery.refetch()}
              />
            }
          />
        );
      }

      return (
        <ProfileSection
          title="Events"
          count={eventsQuery.isLoading ? undefined : eventRows.length}
          description="Every event this person is staffed on, and the role they hold there."
          testId="staff-events-section"
        >
          <StaffEventsTable rows={eventRows} isLoading={eventsQuery.isLoading} />
        </ProfileSection>
      );
    }

    if (devicesFailed) {
      return (
        <ProfileErrorState
          title="Couldn't load the assigned devices"
          description="The service didn't respond. Nothing was changed."
          action={<GrayButtonComponent title="Try again" func={retryDevices} />}
        />
      );
    }

    return (
      <ProfileSection
        title="Assigned devices"
        count={isLoadingDevices ? undefined : deviceRows.length}
        description="Equipment leased to this person, and the contracts signed for it."
        testId="staff-devices-section"
        actions={
          <GrayButtonComponent
            title="Refresh"
            size="sm"
            buttonType="button"
            func={retryDevices}
            loadingState={leaseQuery.isFetching}
          />
        }
      >
        <AssignedDevicesTable
          rows={deviceRows}
          isLoading={isLoadingDevices}
          verificationById={verificationById}
          canManage={canManageDevices}
          isOwnProfile={isOwnProfile}
          onOpenDocument={openDocument}
        />
      </ProfileSection>
    );
  };

  return (
    <div style={{ padding: "16px 24px 24px" }}>
      {contextHolder}
      <ProfileShell
        testId="staff-detail"
        breadcrumb={breadcrumb}
        identity={
          <ProfileIdentityCard
            name={fullName}
            imageUrl={info.imageProfile}
            chips={[
              <StatusChip
                key="access"
                tone={profile.status ? "success" : "critical"}
                pip
                label={profile.status ? "Access active" : "Access removed"}
              />,
              roleName ? <StatusChip key="role" label={roleName} /> : null,
              activeEvents.length > 0 ? (
                <StatusChip
                  key="event"
                  tone="action"
                  label={
                    activeEvents.length === 1
                      ? activeEvents[0].event
                      : `${activeEvents.length} live events`
                  }
                />
              ) : null,
            ].filter(Boolean)}
            factGroups={[
              {
                label: "Contact",
                items: [
                  {
                    value: info.email ?? profile.email,
                    href: `mailto:${info.email ?? profile.email}`,
                  },
                  { value: info.phone, muted: true },
                ],
              },
              {
                label: "Role in this company",
                items: [
                  { value: roleName },
                  {
                    value: isOwnProfile ? "This is your own profile" : null,
                    muted: true,
                  },
                ],
              },
              {
                label: "Next event",
                items: [
                  { value: activeEvents[0]?.event ?? "Not on a live event" },
                  {
                    value:
                      activeEvents.length > 1
                        ? `+${activeEvents.length - 1} more`
                        : null,
                    muted: true,
                  },
                ],
              },
            ]}
            actions={
              <StaffProfileActions
                staffId={staffId}
                canAssignDevices={canManageDevices}
                canAssignEvent={hasPermission("staff:assign_event", roleType)}
                // Location and role are about someone else's permissions, so
                // they stay off your own profile — the old nav hid them the
                // same way, with a `disabled` flag.
                canAssignLocation={
                  hasPermission("staff:assign_location", roleType) && !isOwnProfile
                }
                canChangeRole={
                  hasPermission("staff:change_role", roleType) && !isOwnProfile
                }
                canUpdateContact={
                  hasPermission("staff:update_contact", roleType) && isOwnProfile
                }
                canResetPassword={hasPermission("staff:reset_password", roleType)}
                canEditDetails={hasPermission("staff:update", roleType)}
                onEditDetails={() => setIsEditingDetails(true)}
                accessToggle={
                  hasPermission("staff:grant_access", roleType) && !isOwnProfile
                    ? {
                        isActive: Boolean(profile.active),
                        isPending: updateStaffStatusMutation.isPending,
                        onToggle: () => updateStaffStatusMutation.mutate(),
                      }
                    : null
                }
              />
            }
            testId="staff-identity"
          />
        }
        stats={
          isLoadingDevices || eventsQuery.isLoading ? (
            <ProfileSkeleton lines={2} />
          ) : (
            <ProfileStatTiles
              testId="staff-stats"
              tiles={[
                {
                  label: "Devices out",
                  value: summary.devicesOut,
                  sub:
                    summary.devicesTotal > summary.devicesOut
                      ? `${summary.devicesTotal} on record`
                      : "Currently held",
                },
                {
                  label: "Value held",
                  value: formatMoney(summary.valueOut),
                  sub: "Replacement cost",
                },
                {
                  label: "Contracts pending",
                  value: summary.documentsPending,
                  sub: summary.hasPendingDocuments
                    ? "Not signed for yet"
                    : "All signed",
                  tone: summary.hasPendingDocuments ? "critical" : "neutral",
                },
                {
                  label: "Live events",
                  value: summary.eventsActive,
                  sub: `${summary.eventsTotal} in total`,
                },
              ]}
            />
          )
        }
        tabs={
          <ProfileTabs
            items={TABS}
            activeKey={tab}
            onSelect={setTab}
            ariaLabel="Staff profile sections"
          />
        }
      >
        {section()}
        {/* The action routes render over the profile rather than replacing it. */}
        <Outlet />
        {isEditingDetails && (
          <EditProfileModal
            editProfile={isEditingDetails}
            setEditProfile={setIsEditingDetails}
          />
        )}
      </ProfileShell>
    </div>
  );
};

export default StaffDetail;
