import { useQuery } from "@tanstack/react-query";
import { Divider } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const navigate = useNavigate();
  const slug = location.pathname.split("/").filter(Boolean)?.at(-2);
  const [membersData, setMembersData] = useState(null);
  const companyId = user?.sqlInfo?.company_id;

  const memberInfoRetrieveQuery = useQuery({
    queryKey: ["memberInfoRetrieveQuery"],
    queryFn: () =>
      devitrakApi.post("/db_member/consulting-member", {
        member_id: Number(slug),
        company_id: companyId,
      }),
    enabled: !!slug,
  });

  useEffect(() => {
    if (memberInfoRetrieveQuery?.data?.data?.members) {
      setMembersData(memberInfoRetrieveQuery?.data?.data?.members?.at(-1));
    }
  }, [memberInfoRetrieveQuery.data]);

  const ageFlags = membersData?.date_of_birth
    ? calculateAgeFlags(membersData.date_of_birth)
    : { age: null, minor: false, under_13: false };

  return (
    <>
      <StudentInfoSection
        membersData={membersData}
        companyId={companyId}
        industryFields={fields}
        onSaved={() => memberInfoRetrieveQuery.refetch()}
      />

      {fields.minor && ageFlags.minor && membersData && (
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
