import { useQuery } from "@tanstack/react-query";
import { message } from "antd";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { utils, writeFile } from "xlsx";
import { devitrakApi } from "../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
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
import { fetchStudentConsent } from "../../utils/guardianConsentApi";
import {
  getConsentStatusCopy,
  normalizeConsentStatus,
} from "../../utils/guardianConsentUtils";
import {
  ASSIGNED_DEVICES_EXPORT_COLUMNS,
  buildAssignedDevicesExportRows,
  buildMemberProfileExportPairs,
} from "../../utils/memberExportUtils";

// Consent that needs someone to act reads louder than consent that's merely
// waiting. "agreed" gets no chip at all — good news belongs in the fact list,
// not in the alarm row.
const CONSENT_CHIP_TONE = {
  refused: "critical",
  expired: "critical",
  stale: "warning",
  missing: "warning",
  pending: "neutral",
};

const CONSENT_CHIP_LABEL = {
  refused: "Consent refused",
  expired: "Consent expired",
  stale: "Consent out of date",
  missing: "Consent not requested",
  pending: "Consent pending",
};

const titleCase = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

const MemberProfileIdentity = ({ detailMemberInfo, deviceSummary, setAddingNewMember }) => {
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();

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

  const consentStatus = consentQuery.data
    ? normalizeConsentStatus(consentQuery.data)
    : null;

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
    consentStatus && CONSENT_CHIP_LABEL[consentStatus] && (
      <StatusChip
        key="consent"
        tone={CONSENT_CHIP_TONE[consentStatus]}
        pip={CONSENT_CHIP_TONE[consentStatus] !== "neutral"}
        label={CONSENT_CHIP_LABEL[consentStatus]}
        title={getConsentStatusCopy(consentStatus)}
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
    consentStatus && {
      label: "Consent",
      items: [
        { value: `Device AUP · ${titleCase(consentStatus)}` },
        { value: getConsentStatusCopy(consentStatus), muted: true },
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
