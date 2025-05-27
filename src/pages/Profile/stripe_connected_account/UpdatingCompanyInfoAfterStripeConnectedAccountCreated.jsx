import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { useEffect } from "react";
import { onLogin } from "../../../store/slices/adminSlice";
import { checkArray } from "../../../components/utils/checkArray";

const UpdatingCompanyInfoAfterStripeConnectedAccountCreated = () => {
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const companyDataQuery = useQuery({
    queryKey: ["companyDataQuery"],
    queryFn: () =>
      devitrakApi.post("/company/search-company", {
        stripe_customer_id: user.companyData.stripe_customer_id,
      }),
  });
  useEffect(() => {
    const controller = new AbortController();
    if (companyDataQuery.data) {
      const triggerRedirection = async () => {
        const companyInfo = checkArray(companyDataQuery?.data?.data?.company)
        dispatch(
          onLogin({
            ...user,
            companyData: companyInfo,
          })
        );
        navigate("/profile/stripe_connected_account");
      };
      triggerRedirection();
    }
    return () => {
      controller.abort();
    };
  }, [companyDataQuery.data]);

  return <div>UpdatingCompanyInfoAfterStripeConnectedAccountCreated</div>;
};

export default UpdatingCompanyInfoAfterStripeConnectedAccountCreated;
