import { devitrakApi } from "../../../api/devitrakApi";
import { checkArray } from "../../../components/utils/checkArray";

const createCompany = async ({
  props,
  ref,
  companyValue,
  locationList,
  websiteUrl,
  industry,
  user,
}) => {
  const companyTemplate = {
    company_name: companyValue,
    address: {
      street: props.street,
      city: props.city,
      state: props.state,
      postal_code: props.postal_code,
    },
    location: locationList,
    phone: {
      main: props.main_phone,
      alternative: props.alternative_phone,
    },
    owner: {
      first_name: user.name,
      last_name: user.lastName,
      email: user.email,
    },
    website: websiteUrl,
    main_email: user.email,
    industry: industry,
    stripe_customer_id: ref.current.stripeAccount.stripeID,
    employees: [
      {
        userId: user.userID ? user.userID : ref.current.userRegistration.uid,
        user: user.email,
        firstName: user.name,
        lastName: user.lastName,
        status: "confirmed",
        super_user: true,
        role: "0",
        preference: { inventory_location: [] },
      },
    ],
    company_logo: props.company_logo,
  };
  const checkingExistingCompany = await devitrakApi.post(
    `/company/search-company`,
    {
      stripe_customer_id: ref.current.stripeAccount.stripeID,
    }
  );
  if (checkingExistingCompany.data.company.length > 0) {
    const companyData = checkArray(checkingExistingCompany.data.company);
    return (ref.current = {
      ...ref.current,
      companyData: companyData,
    });
  } else {
    const resp = await devitrakApi.post("/company/new", companyTemplate);
    if (resp.data) {
      const companyData = checkArray(resp.data.company);
      ref.current = {
        ...ref.current,
        companyData: companyData,
      };
      return;
    }
  }
};

export default createCompany;
