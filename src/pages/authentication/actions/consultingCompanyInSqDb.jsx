import { devitrakApi } from "../../../api/devitrakApi";
import { checkArray } from "../../../components/utils/checkArray";

const consultingCompanyInSqDb = async (ref, token) => {
        const config = token ? { headers: { "x-token": token } } : {};
        const companyInfo = await devitrakApi.post(
          "/db_company/consulting-company",
          {
            company_id: ref.current.companySQL,
          },
          config
        );
        if (companyInfo.data) {
          const sqlInfo = {
            ...checkArray(companyInfo.data.company),
            stripeID: ref.current.stripeAccount.stripeID,
          };
          return (ref.current = {
            ...ref.current,
            sqlInfo: sqlInfo,
          });
        }
      };
    
export default consultingCompanyInSqDb