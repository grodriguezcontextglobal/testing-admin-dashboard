
import { useEffect, useMemo, useState } from "react";
import DevitrakLoading from "../../components/animation/DevitrakLoading";
import "./style/authStyle.css";
import StaffMemberVerificationSignatureAndSignatureStampComponent from "./signatureVerificationDocuments/StaffMember";
import ConsumerMemberVerificationSignatureAndSignatureStampComponent from "./signatureVerificationDocuments/Consumer";

const LandingPageForDownloadableDocuments = () => {
  const staff_member_id = new URLSearchParams(window.location.search).get(
    "staff_member_id"
  );
  const consumer_info = new URLSearchParams(window.location.search).get(
    "consumer_member_id"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [staffMember, setStaffMember] = useState(true);
  useMemo(
    () => (!staff_member_id ? setStaffMember(false) : setStaffMember(true)),
    [staff_member_id, consumer_info]
  );

  useEffect(() => {
    setIsLoading(false);
  }, [consumer_info, staff_member_id])
  
  return (
    <>
      {isLoading ? <DevitrakLoading fullscreen /> : null}
      {staffMember ? (
        <StaffMemberVerificationSignatureAndSignatureStampComponent />
      ) : (
        <ConsumerMemberVerificationSignatureAndSignatureStampComponent />
      )}
    </>
  );
};

export default LandingPageForDownloadableDocuments;
