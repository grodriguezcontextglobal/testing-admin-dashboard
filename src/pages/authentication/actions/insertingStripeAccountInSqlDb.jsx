import { devitrakApi } from "../../../api/devitrakApi";

const insertingStripeAccountInSqlDb = async (ref, token) => {
        const config = token ? { headers: { "x-token": token } } : {};
        const checkingExistingData = await devitrakApi.post(
          "/db_stripe/consulting-stripe",
          {
            stripe_id: ref.current.stripeAccount.stripeID,
            company_id: ref.current.companySQL,
          },
          config
        );
        if (checkingExistingData.data.stripe.length > 0) {
          return null;
        }
        const insertingStripeCompanyInfo = await devitrakApi.post(
          "/db_stripe/new_stripe",
          {
            stripe_id: ref.current.stripeAccount.stripeID,
            company_id: ref.current.companySQL,
          },
          config
        );
        if (insertingStripeCompanyInfo.data) {
          ref.current = {
            ...ref.current,
            stripeSQL: insertingStripeCompanyInfo.data,
          };
          return insertingStripeCompanyInfo.data;
        }
      };
    
export default insertingStripeAccountInSqlDb