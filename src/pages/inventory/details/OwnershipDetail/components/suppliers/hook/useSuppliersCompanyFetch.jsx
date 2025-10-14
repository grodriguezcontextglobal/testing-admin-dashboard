import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import { groupBy } from "lodash";

const useSuppliersCompanyFetch = () => {
  const [suppliers, setSuppliers] = useState([]);
  const { user } = useSelector((state) => state.admin);

  useEffect(() => {
    const controller = new AbortController();
    const getSuppliers = async () => {
      try {
        const getSuppliersQuery = await devitrakApi.get(
          `/company/provider-companies?creator=${user.companyData.id}`,
          { signal: controller.signal }
        );
        if (getSuppliersQuery.data) {
          //   const suppliers = [];
          //   getSuppliersQuery.data.result.forEach((supplier) => {
          //     suppliers.push(supplier.supplier_info);
          //   });
          const sortedData = groupBy(
            getSuppliersQuery?.data?.providerCompanies,
            "id"
          );
          setSuppliers(sortedData);
        }
      } catch (error) {
        // Handle both AbortError and CanceledError from Axios
        if (error.name !== "AbortError" && error.name !== "CanceledError") {
          console.error("Error fetching suppliers:", error);
        }
        // Silently ignore cancellation errors as they're expected
      }
    };

    if (user?.companyData?.id) {
      getSuppliers();
    }

    return () => {
      controller.abort();
    };
  }, [user?.companyData?.id]); // Add dependency

  return suppliers;
};

export default useSuppliersCompanyFetch;
