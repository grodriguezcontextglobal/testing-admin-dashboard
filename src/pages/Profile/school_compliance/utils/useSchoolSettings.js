import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { fetchSchoolSettings } from "./schoolComplianceUtils";

/**
 * Custom hook to fetch school compliance settings.
 * Only fires when company industry is "Education".
 */
export function useSchoolSettings() {
  const { user } = useSelector((state) => state.admin);
  const industry = user?.companyData?.industry;
  const companyId = user?.sqlInfo?.company_id;
  const isEducation = industry === "Education";

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["schoolSettings", companyId],
    queryFn: () => fetchSchoolSettings(companyId),
    enabled: isEducation && Boolean(companyId),
  });

  return {
    settings: data?.settings ?? {},
    isLoading,
    error,
    refetch,
    isEducation,
  };
}
