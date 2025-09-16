import { useEffect, useState } from "react";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import { WhiteCirclePlusIcon } from "../../../../components/icons/WhiteCirclePlusIcon";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { devitrakApi } from "../../../../api/devitrakApi";
import { useSelector } from "react-redux";

const useSuppliers = () => {
  const { user } = useSelector((state) => state.admin);
  const queryClient = useQueryClient();
  const providersList = useQuery({
    queryKey: ["providersCompanyQuery", user?.companyData?.id],
    queryFn: () =>
      devitrakApi.get("/company/provider-companies", {
        params: {
          creator: user?.companyData?.id,
        },
      }),
    enabled: !!user?.companyData?.id,
    refetchOnMount: false,
    staleTime: 60 * 1000 * 5, // 5 minutes
  });
  const [supplierModal, setSupplierModal] = useState(false);
  const [dicSuppliers, setDicSuppliers] = useState({});
  const [supplierList, setSupplierList] = useState([
    {
      value: (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
          }}
        >
          <BlueButtonComponent
            title={"Add supplier"}
            styles={{ with: "100%" }}
            icon={<WhiteCirclePlusIcon />}
            buttonType="button"
            titleStyles={{
              textTransform: "none",
              with: "100%",
            }}
            func={() => setSupplierModal(true)}
          />
        </div>
      ),
    },
  ]);
  const refetchingAfterNewSupplier = () => {
    queryClient.invalidateQueries([
      "providersCompanyQuery",
      user?.companyData?.id,
    ]);
    return providersList.refetch();
  };
  useEffect(() => {
    const suppliersOptionsRendering = () => {
      let result = [];
      if (providersList?.data?.data?.providerCompanies?.length > 0) {
        providersList?.data?.data?.providerCompanies?.map((item) => {
          result.push({ value: item.companyName });
        });
      }
      const final = new Set(result);
      return setSupplierList([...supplierList, ...Array.from(final)]);
    };
    const diccionarySuppliers = () => {
      const dic = new Map();
      if (providersList?.data?.data?.providerCompanies?.length > 0) {
        providersList?.data?.data?.providerCompanies?.map((item) => {
          if (!dic.has(item.companyName)) {
            let c = {};
            c[item.companyName] = item.id;
            dic.set(item.companyName, item.id);
          }
        });
      }
      return setDicSuppliers(Array.from(dic));
    };
    suppliersOptionsRendering();
    diccionarySuppliers();
  }, [providersList.data, providersList.isRefetching]);

  console.log(providersList?.data?.data?.providerCompanies);
  return {
    providersList,
    queryClient,
    setSupplierModal,
    supplierModal,
    refetchingAfterNewSupplier,
    dicSuppliers,
    supplierList,
  };
};

export default useSuppliers;
