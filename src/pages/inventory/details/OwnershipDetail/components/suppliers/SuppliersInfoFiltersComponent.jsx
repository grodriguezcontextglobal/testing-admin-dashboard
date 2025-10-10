import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../api/devitrakApi";

const useSuppliersFetch = () => {
  const [suppliers, setSuppliers] = useState([]);
  const { user } = useSelector((state) => state.admin);

  useEffect(() => {
    const controller = new AbortController();
    const getSuppliers = async () => {
      try {
        const getSuppliersQuery = await devitrakApi.post(
          "/db_company/filter-suppliers-info-items",
          {
            company_id: user.sqlInfo.company_id,
          },
          { signal: controller.signal }
        );
        if (getSuppliersQuery.data) {
          const suppliers = [];
          getSuppliersQuery.data.result.forEach((supplier) => {
            return suppliers.push(supplier.supplier_info);
          });
          setSuppliers(suppliers);
        }
      } catch (error) {
        // Handle both AbortError and CanceledError from Axios
        if (error.name !== "AbortError" && error.name !== "CanceledError") {
          console.error("Error fetching suppliers:", error);
        }
        // Silently ignore cancellation errors as they're expected
      }
    };

    if (user?.sqlInfo?.company_id) {
      getSuppliers();
    }

    return () => {
      controller.abort();
    };
  }, [user?.sqlInfo?.company_id]);

  return suppliers;
};

export default useSuppliersFetch;
