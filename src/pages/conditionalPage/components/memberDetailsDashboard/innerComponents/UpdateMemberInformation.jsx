import { useQuery } from "@tanstack/react-query";
import { Divider } from "antd";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import { getIndustryProfile } from "../../../../../config/industryProfiles";
import { calculateAgeFlags } from "../../../utils/ageCalculationUtils";
import GuardianInfoSection from "./GuardianInfoSection";
import StudentInfoSection from "./StudentInfoSection";

/**
 * Thin orchestrator for the member edit page — fetches the member record
 * once and renders two independently-saving sections: student/member info
 * (always) and guardian info + consent (Education minors only).
 */
const UpdateMemberInformation = () => {
  const { user } = useSelector((state) => state.admin);
  const { memberInfo } = useSelector((state) => state.member);
  const { fields, representative } = getIndustryProfile(
    user?.companyData?.industry
  );
  const navigate = useNavigate();
  const { id: memberId } = useParams();
  const companyId = user?.sqlInfo?.company_id;

  const memberInfoRetrieveQuery = useQuery({
    // Same key and same request as the profile shell's query, so the two share
    // one cache entry. Saving a guardian here therefore refreshes the header's
    // guardian block and consent chip instead of leaving them stale.
    queryKey: ["memberInfoRetrieveQuery", String(memberId ?? "")],
    queryFn: () =>
      devitrakApi.post("/db_member/consulting-member", {
        member_id: Number(memberId),
        company_id: companyId,
      }),
    enabled: !!memberId && !!companyId,
  });

  const members = memberInfoRetrieveQuery.data?.data?.members;
  const membersData = Array.isArray(members) ? members.at(-1) : members ?? null;

  const ageFlags = membersData?.date_of_birth
    ? calculateAgeFlags(membersData.date_of_birth)
    : { age: null, minor: false, under_13: false };

  // Prefer the age derived from date_of_birth, but fall back to the stored
  // `minor` flag when there's no birthdate to derive from. Records can carry
  // one without the other — the school demo seeder writes `minor` directly and
  // never sets date_of_birth — and without this fallback those students show a
  // guardian in the header with no way to edit them.
  const requiresRepresentative = ageFlags.minor || membersData?.minor === 1;

  return (
    <>
      <StudentInfoSection
        membersData={membersData}
        companyId={companyId}
        industryFields={fields}
        onSaved={() => memberInfoRetrieveQuery.refetch()}
      />

      {fields.minor && requiresRepresentative && membersData && (
        <>
          <Divider />
          <GuardianInfoSection
            memberId={membersData?.member_id ?? membersData?.id}
            companyId={companyId}
            initialGuardian={{
              first_name: membersData?.parent_guardian_first_name,
              last_name: membersData?.parent_guardian_last_name,
              email: membersData?.parent_guardian_email,
              phone_number: membersData?.parent_guardian_phone_number,
            }}
            memberData={membersData}
            representative={representative}
            onSaved={() => memberInfoRetrieveQuery.refetch()}
          />
        </>
      )}

      <Divider />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <GrayButtonComponent
          title="Cancel"
          func={() => navigate(`/member/${memberInfo?.member_id}/main`)}
        />
      </div>
    </>
  );
};

export default UpdateMemberInformation;
