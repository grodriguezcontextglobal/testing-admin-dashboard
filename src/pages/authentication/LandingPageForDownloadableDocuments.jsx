
import { useEffect, useState } from "react";
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
  // A link with a staff member id is a staff contract; any other, a consumer's.
  const staffMember = Boolean(staff_member_id);

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
