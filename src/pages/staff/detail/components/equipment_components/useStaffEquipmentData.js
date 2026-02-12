import { useQuery, useQueries } from "@tanstack/react-query";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { checkArray } from "../../../../../components/utils/checkArray";

// Helper function to fetch a single verification document
const fetchVerificationDocument = async (verificationId) => {
  if (!verificationId) return null;
  try {
    const res = await devitrakApi.post(
      `/document/verification/staff_member/check_signed_document`,
      { verificationID: verificationId },
    );
    const contractList =
      res?.data?.contract_info?.contract_list ||
      res?.data?.verification?.contract_list ||
      res?.data?.data?.contract_list ||
      [];

    const deriveTitleFromUrl = (url) => {
      try {
        const last = url?.split("/")?.pop() || "";
        return decodeURIComponent(last);
      } catch {
        return url || "Document";
      }
    };

    let docs = [];
    if (Array.isArray(contractList) && contractList.length > 0) {
      docs = contractList.map((c) => ({
        key: c._id || c.document_url,
        title: deriveTitleFromUrl(c.document_url),
        url: c.document_url,
        signed: !!c.signature || c.signed === true,
        date: c?.date || c?.updatedAt || c?.createdAt,
      }));
    }

    const allSigned = docs.length > 0 && docs.every((d) => d.signed);
    return { verificationId, docs, allSigned };
  } catch (error) {
    console.error(`Error fetching verification ${verificationId}:`, error);
    return { verificationId, docs: [], allSigned: false };
  }
};

export const useStaffEquipmentData = (profile, user) => {
  const staffMemberQuery = useQuery({
    queryKey: ["staffMemberInfo", profile?.email],
    queryFn: () =>
      devitrakApi.post("/db_staff/consulting-member", {
        email: profile.email,
      }),
    enabled: !!user.uid && !!profile?.email,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const listImagePerItemQuery = useQuery({
    queryKey: ["imagePerItemList", user.company],
    queryFn: () => devitrakApi.post("/image/images", { company: user.company }),
    enabled: !!user.uid && !!user.company,
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });

  const itemsInInventoryQuery = useQuery({
    queryKey: ["ItemsInventoryCheckingQuery", user.sqlInfo?.company_id],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
      }),
    enabled: !!user.uid && !!user.sqlInfo?.company_id,
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });

  const leaseQuery = useQuery({
    queryKey: ["assignedEquipmentStaff", staffMemberQuery.data?.data?.member],
    queryFn: async () => {
      const staffmemberInfo = await checkArray(
        staffMemberQuery.data?.data?.member,
      );
      if (!staffmemberInfo?.staff_id) return [];

      const response = await devitrakApi.post("/db_lease/consulting-lease", {
        staff_member_id: staffmemberInfo.staff_id,
        company_id: user.sqlInfo.company_id,
        subscription_current_in_use: 1,
      });
      return response.data?.ok ? response.data.lease : [];
    },
    enabled: !!staffMemberQuery.data && !!user.sqlInfo?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const assignedEquipmentList = leaseQuery.data || [];

  // Parallel fetch for all verification documents to support the "Contract Status" column
  // and ensure data is ready or loading when a row is expanded.
  const verificationQueries = useQueries({
    queries: assignedEquipmentList.map((item) => ({
      queryKey: ["verificationDocument", item.verification_id],
      queryFn: () => fetchVerificationDocument(item.verification_id),
      enabled: !!item.verification_id,
      staleTime: 10 * 60 * 1000, // 10 minutes
    })),
  });

  return {
    staffMemberQuery,
    listImagePerItemQuery,
    itemsInInventoryQuery,
    leaseQuery,
    verificationQueries, // Return the array of query results
  };
};
