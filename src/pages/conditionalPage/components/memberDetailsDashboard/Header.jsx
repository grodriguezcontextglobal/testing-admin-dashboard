import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import PropTypes from "prop-types";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { utils, writeFile } from "xlsx";
import { registerStaffActivity } from "../../../../api/activityLog";
import { devitrakApi } from "../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import DangerButtonConfirmationComponent from "../../../../components/UX/buttons/DangerButtonConfirmation";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import {
  ProfileIdentityCard,
  StatusChip,
} from "../../../../components/UX/profile";
import {
  hasPermission,
  isCoordinatorLevel,
  resolveRoleType,
} from "../../../../config/roles";
import { fetchSchoolSettings } from "../../../Profile/school_compliance/utils/schoolComplianceUtils";
import { calculateStudentAgeFlags } from "../../utils/ageCalculationUtils";
import { fetchStudentConsent } from "../../utils/guardianConsentApi";
import {
  describeMemberConsent,
  normalizeConsentStatus,
} from "../../utils/guardianConsentUtils";
import {
  ASSIGNED_DEVICES_EXPORT_COLUMNS,
  buildAssignedDevicesExportRows,
  buildMemberProfileExportPairs,
} from "../../utils/memberExportUtils";
import {
  buildDeleteMemberAuditEntry,
  buildDeleteMemberPayload,
  deleteMemberEligibility,
  describeDeleteConsequence,
  memberLabel,
} from "./utils/deleteMember";

const titleCase = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

const MemberProfileIdentity = ({ detailMemberInfo, deviceSummary, setAddingNewMember }) => {
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteFailure, setDeleteFailure] = useState("");

  const memberId = detailMemberInfo?.member_id;
  const companyId = user?.sqlInfo?.company_id;
  const isStudent = detailMemberInfo?.minor === 1;

  // Only students carry guardian consent; don't fire this for every member.
  const consentQuery = useQuery({
    queryKey: ["studentConsent", memberId],
    queryFn: () => fetchStudentConsent(companyId, memberId),
    enabled: Boolean(isStudent && memberId && companyId),
    retry: false,
  });

  /* Whether the company asks for consent at all decides how this reads. Same
     query key and staleTime as the readiness dashboard, so the two share one
     cached copy of the settings. */
  const settingsQuery = useQuery({
    queryKey: ["schoolSettings", companyId],
    queryFn: () => fetchSchoolSettings(companyId),
    enabled: Boolean(companyId && isStudent),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const consentStatus = consentQuery.data
    ? normalizeConsentStatus(consentQuery.data)
    : null;

  /* A company that does not require consent used to get "Consent not requested"
     in warning yellow with an alarm pip — a compliance failure to chase, for
     something nobody was supposed to have done. */
  const ageFlags = calculateStudentAgeFlags(detailMemberInfo?.date_of_birth);
  const consent = describeMemberConsent({
    status: consentStatus,
    settings: settingsQuery.data?.settings,
    isMinor: isStudent || ageFlags.minor,
    isUnder13: ageFlags.under_13,
  });

  const handleExportMemberData = async () => {
    try {
      const response = await devitrakApi.post(
        "/db_member/retrieve-members-assigned-devices",
        {
          member_id: memberId,
          company_id: companyId,
          returned: 0,
        }
      );
      const deviceRows = buildAssignedDevicesExportRows(response?.data?.rows);
      const profilePairs = buildMemberProfileExportPairs(detailMemberInfo);

      const wb = utils.book_new();

      const profileWs = utils.aoa_to_sheet([
        ["Field", "Value"],
        ...profilePairs.map((p) => [p.field, p.value]),
      ]);
      profileWs["!cols"] = [{ width: 24 }, { width: 30 }];
      utils.book_append_sheet(wb, profileWs, "Member Profile");

      const devicesWs = utils.aoa_to_sheet([
        ASSIGNED_DEVICES_EXPORT_COLUMNS.map((c) => c.label),
        ...deviceRows.map((row) =>
          ASSIGNED_DEVICES_EXPORT_COLUMNS.map((c) => row[c.key])
        ),
      ]);
      devicesWs["!cols"] = ASSIGNED_DEVICES_EXPORT_COLUMNS.map(() => ({
        width: 22,
      }));
      devicesWs["!autofilter"] = {
        ref: `A1:${String.fromCharCode(
          64 + ASSIGNED_DEVICES_EXPORT_COLUMNS.length
        )}1`,
      };
      utils.book_append_sheet(wb, devicesWs, "Assigned Devices");

      const fileNameLabel = `${detailMemberInfo?.first_name ?? "member"}_${
        detailMemberInfo?.last_name ?? ""
      }`.replace(/\s+/g, "_");
      writeFile(wb, `${fileNameLabel}_export_${Date.now()}.xlsx`);
      message.success("Member data exported.");
    } catch {
      message.error("Failed to export member data. Please try again.");
    }
  };

  /* Removing the member from their own page, which the bulk modal on the list
     could already do for a selection. The one thing it never asked: whether
     they are still holding anything. */
  const removal = deleteMemberEligibility(deviceSummary);

  const deleteMemberMutation = useMutation({
    mutationFn: async () => {
      const response = await devitrakApi.post(
        "/db_member/delete-member-info",
        buildDeleteMemberPayload({ memberId, companyId })
      );
      // These endpoints answer 200 with `{ ok: false, msg }` when they refuse.
      if (response?.data?.ok === false) {
        throw new Error(response.data.msg || "The member was not deleted.");
      }
      return response?.data;
    },
    onSuccess: () => {
      // The record is about to be gone, so the audit row is the only place the
      // name survives.
      registerStaffActivity(buildDeleteMemberAuditEntry(detailMemberInfo));
      ["allMembersInfoDataQuery", "membersInfoQuery"].forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey: [queryKey], exact: true })
      );
      message.success(`${memberLabel(detailMemberInfo)} was removed.`);
      navigate("/members");
    },
    onError: (error) => {
      setDeleteFailure(
        error?.response?.data?.msg ||
          error?.message ||
          "The member was not deleted. Nothing was changed — try again."
      );
    },
  });

  const fullName = `${detailMemberInfo?.first_name ?? ""} ${
    detailMemberInfo?.last_name ?? ""
  }`.trim();

  const chips = [
    deviceSummary?.overdue > 0 && (
      <StatusChip
        key="overdue"
        tone="critical"
        pip
        label={`${deviceSummary.overdue} overdue`}
        title={
          deviceSummary.longestOverdueDays
            ? `Longest overdue: ${deviceSummary.longestOverdueDays} days`
            : undefined
        }
      />
    ),
    consent.chip && (
      <StatusChip
        key="consent"
        tone={consent.chip.tone}
        pip={consent.chip.pip}
        label={consent.chip.label}
        title={consent.chip.title}
      />
    ),
    detailMemberInfo?.grade && (
      <StatusChip key="grade" label={`Grade ${detailMemberInfo.grade}`} />
    ),
    detailMemberInfo?.homeroom && (
      <StatusChip key="homeroom" label={detailMemberInfo.homeroom} />
    ),
    detailMemberInfo?.external_id && (
      <StatusChip key="external" label={detailMemberInfo.external_id} />
    ),
  ].filter(Boolean);

  const guardianName = [
    detailMemberInfo?.parent_guardian_first_name,
    detailMemberInfo?.parent_guardian_last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const factGroups = [
    {
      label: "Contact",
      items: [
        detailMemberInfo?.email
          ? { value: detailMemberInfo.email, href: `mailto:${detailMemberInfo.email}` }
          : { value: "No email on file", muted: true },
        // A missing phone shows as an em dash. The old placeholder
        // "+1-000-000-0000" looked like a real number somebody could dial.
        { value: detailMemberInfo?.phone_number || "—" },
      ],
    },
    {
      label: "Guardian",
      items: [
        { value: guardianName },
        detailMemberInfo?.parent_guardian_email && {
          value: detailMemberInfo.parent_guardian_email,
          href: `mailto:${detailMemberInfo.parent_guardian_email}`,
        },
        { value: detailMemberInfo?.parent_guardian_phone_number },
      ].filter(Boolean),
    },
    hasPermission("member:delete", resolveRoleType(user)) &&
      (deleteFailure || (!removal.deletable && removal.reason === "holding-devices")) && {
        label: "Removing this member",
        items: [
          { value: deleteFailure || removal.detail, muted: !deleteFailure },
        ],
      },
    consent.fact && {
      label: "Consent",
      items: [
        { value: `Device AUP · ${titleCase(consent.fact.status)}` },
        { value: consent.fact.note, muted: true },
      ],
    },
  ].filter(Boolean);

  // Same permissions that used to gate the tab-bar entries; they follow the
  // actions to the rail rather than disappearing with the tabs.
  const roleType = resolveRoleType(user);

  const actions = (
    <>
      {hasPermission("member:assign_devices", roleType) && (
        <BlueButtonComponent
          title={"Assign devices"}
          func={() => navigate(`/member/${memberId}/assignment`)}
        />
      )}
      {hasPermission("member:notify", roleType) && (
        <GrayButtonComponent
          title={"Send reminder"}
          func={() => navigate(`/member/${memberId}/reminders`)}
        />
      )}
      <GrayButtonComponent
        title={"Export data (.xlsx)"}
        func={handleExportMemberData}
      />
      {isCoordinatorLevel(user.roleType) && (
        <GrayButtonComponent
          title={"Add new member"}
          func={() => setAddingNewMember(true)}
        />
      )}
      {hasPermission("member:delete", roleType) && (
        <DangerButtonConfirmationComponent
          title={"Delete member"}
          confirmationTitle={`Delete ${memberLabel(detailMemberInfo)}?`}
          confirmationDescription={describeDeleteConsequence(detailMemberInfo)}
          okText="Delete"
          func={() => {
            setDeleteFailure("");
            deleteMemberMutation.mutate();
          }}
          /* Held back while they are still holding a device: deleting them
             leaves the assignment pointing at nobody. The reason is on the
             button rather than only in a message nobody asked for. */
          isDisabled={!removal.deletable}
          isLoading={deleteMemberMutation.isPending}
          ariaLabel={
            removal.deletable ? "Delete member" : `Cannot delete: ${removal.detail}`
          }
        />
      )}
    </>
  );

  return (
    <ProfileIdentityCard
      name={fullName}
      imageUrl={detailMemberInfo?.image_url}
      chips={chips}
      factGroups={factGroups}
      actions={actions}
      testId="member-identity"
    />
  );
};

MemberProfileIdentity.propTypes = {
  detailMemberInfo: PropTypes.object,
  deviceSummary: PropTypes.object,
  setAddingNewMember: PropTypes.func,
};

MemberProfileIdentity.defaultProps = {
  detailMemberInfo: null,
  deviceSummary: null,
  setAddingNewMember: () => {},
};

export default MemberProfileIdentity;
