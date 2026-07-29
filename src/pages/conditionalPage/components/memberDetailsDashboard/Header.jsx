import { Divider, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { utils, writeFile } from "xlsx";
import { devitrakApi } from "../../../../api/devitrakApi";
import Breadcrumb from "../../../../components/UX/breadcrumbs/Breadcrumb";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import RefactoredHeaderUntitledUiReact from "../../../../components/UX/header/DynamicHeaderCompnent";
import DevitrakLoading from "../../../../components/animation/DevitrakLoading";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";
import { isCoordinatorLevel } from "../../../../config/roles";
import { onRemoveMemberInfo } from "../../../../store/slices/memberSlice";
import {
  ASSIGNED_DEVICES_EXPORT_COLUMNS,
  buildAssignedDevicesExportRows,
  buildMemberProfileExportPairs,
} from "../../utils/memberExportUtils";

const MemberInfoHeader = ({ memberInfo, groupName, setAddingNewMember }) => {
  const detailMemberInfo = memberInfo?.at(-1);
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  if (!detailMemberInfo) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <DevitrakLoading />
      </div>
    );
  }
  const style = {
    titleNavigation: {
      textTransform: "none",
      textAlign: "left",
      fontWeight: 600,
      fontSize: "18px",
      fontFamily: "Inter",
      lineHeight: "28px",
      color: "var(--blue-dark-600, #155EEF)",
      cursor: "pointer"
    },
    breadcrumbTitle: {
      ...TextFontsize18LineHeight28,
      textTransform: "none",
    },
  };

  const handleExportMemberData = async () => {
    try {
      const response = await devitrakApi.post(
        "/db_member/retrieve-members-assigned-devices",
        {
          member_id: detailMemberInfo?.member_id,
          company_id: user?.sqlInfo?.company_id,
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

  const breadcrumbItems = [
    {
      title: <p style={style.titleNavigation} onClick={() => { navigate("/members", { state: { referencing: groupName } }); dispatch(onRemoveMemberInfo()) }}>All {groupName}</p>,
      link: "/members",
      state: { referencing: groupName },
    },
    {
      title: <p style={style.breadcrumbTitle}>{`${detailMemberInfo?.first_name}, ${detailMemberInfo?.last_name}`}</p>,
    },
  ];

  const actions = {
    desktop: (
      <div style={{ display: "flex", gap: 8 }}>
        <GrayButtonComponent
          title={"Export data (.xlsx)"}
          func={handleExportMemberData}
        />
        {isCoordinatorLevel(user.roleType) && (
          <BlueButtonComponent
            title={"Add new member"}
            func={() => setAddingNewMember(true)}
          />
        )}
      </div>
    ),
    mobile: (
      <div style={{ display: "flex", gap: 8 }}>
        <GrayButtonComponent
          title={"Export"}
          func={handleExportMemberData}
        />
        {isCoordinatorLevel(user.roleType) && (
          <BlueButtonComponent
            title={"Add new"}
            func={() => setAddingNewMember(true)}
          />
        )}
      </div>
    ),
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Breadcrumb path={breadcrumbItems} />
      <Divider style={{ margin: "0.5rem 0" }} />
      <RefactoredHeaderUntitledUiReact
        title={`${detailMemberInfo?.first_name} ${detailMemberInfo?.last_name ?? ""}`}
        subtitle={[
          detailMemberInfo?.grade ? `Grade ${detailMemberInfo.grade}` : null,
          detailMemberInfo?.homeroom || null,
          detailMemberInfo?.external_id ? `External ID: ${detailMemberInfo.external_id}` : null,
        ].filter(Boolean).join(" · ") || null}
        actions={actions.desktop}
        image={detailMemberInfo?.image_url}
        centerContentComponentTitle={"Contact"}
        email={detailMemberInfo?.email}
        phone={detailMemberInfo?.phone_number ?? "+1-000-000-0000"}
        isMinor={detailMemberInfo.minor === 1}
        guardianName={`${detailMemberInfo.parent_guardian_first_name} ${detailMemberInfo.parent_guardian_last_name}`}
        guardianEmail={detailMemberInfo.parent_guardian_email}
        guardianPhone={detailMemberInfo.parent_guardian_phone_number}
      />
    </div>
  );
};

export default MemberInfoHeader;
