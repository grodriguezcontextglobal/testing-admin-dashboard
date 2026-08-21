import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import {
  ProfileErrorState,
  ProfileSection,
  ProfileSkeleton,
} from "../../../../../../components/UX/profile";
import SignaturesProof from "../SignaturesProof";
import { useSelectedConsumer } from "../hooks/useConsumerEventActivity";

/**
 * The Documents tab: everything this consumer accepted at this event, in one
 * list.
 *
 * These records were only reachable before by expanding a transaction row and
 * scrolling past its device table — so answering "did they sign the waiver?"
 * meant opening every transaction in turn. The same records, one place.
 */
const DocumentsDetails = () => {
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const consumer = useSelectedConsumer();

  const companyId = user?.companyData?.id;

  const signaturesQuery = useQuery({
    queryKey: ["consumerSignatures", event?.id, companyId, consumer?.id],
    queryFn: () =>
      devitrakApi.post("/company/consumer-signatures", {
        event_id: event.id,
        company_id: companyId,
        consumer_id: consumer.id,
      }),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(event?.id && companyId && consumer?.id),
  });

  const signatures = signaturesQuery.data?.data?.signatures ?? [];

  const body = () => {
    if (signaturesQuery.isLoading) {
      return (
        <div style={{ padding: "8px 20px 20px" }}>
          <ProfileSkeleton lines={3} />
        </div>
      );
    }
    if (signaturesQuery.isError) {
      return (
        <ProfileErrorState
          title="Couldn't load documents"
          description="The document service didn't respond. Nothing was changed."
          action={
            <GrayButtonComponent
              title="Try again"
              func={() => signaturesQuery.refetch()}
            />
          }
        />
      );
    }
    return (
      <div style={{ padding: "0 16px 12px" }}>
        <SignaturesProof
          data={signatures}
          emptyLabel="Nothing signed at this event yet"
        />
      </div>
    );
  };

  return (
    <ProfileSection
      title="Signed documents"
      description="Waivers and terms this consumer accepted at this event."
      testId="consumer-documents-section"
    >
      {body()}
    </ProfileSection>
  );
};

export default DocumentsDetails;
