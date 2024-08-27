import { devitrakApi } from "../../../api/devitrakApi";
import { checkArray } from "../../../components/utils/checkArray";

const createStripeAccount = async ({ companyValue, user, ref }) => {
  const newCompanyAccountTemplate = {
    companyName: companyValue,
    ownerFirstName: user.name,
    ownerLastName: user.lastName,
    ownerEmail: user.email,
  };
  const checkExistingStripeAccount = await devitrakApi.post(
    `/stripe/company-account-stripe`,
    {
      company: companyValue,
      ownerFirstName: user.name,
      ownerLastName: user.lastName,
      ownerEmail: user.email,
    }
  );
  if (checkExistingStripeAccount.data.companyStripeAccountFound) {
    ref.current = {
      ...ref.current,
      stripeAccount: checkArray(
        checkExistingStripeAccount.data.companyStripeAccountFound
      ),
    };
    return checkExistingStripeAccount.data;
  } else {
    const creatingStripeCustomer = await devitrakApi.post(
      "/stripe/new-company-account",
      newCompanyAccountTemplate
    );
    if (creatingStripeCustomer.data) {
      ref.current = {
        ...ref.current,
        stripeAccount: checkArray(creatingStripeCustomer.data.companyCustomer),
      };
      return creatingStripeCustomer.data;
    }
  }
};

export default createStripeAccount;
