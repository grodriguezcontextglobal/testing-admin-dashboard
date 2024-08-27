import { devitrakApi } from "../../../api/devitrakApi";
import { checkArray } from "../../../components/utils/checkArray";

const insertingNewCompanyInSqlDb = async ({
  props,
  companyValue,
  ref,
  industry,
  websiteUrl,
}) => {
  const checkingExistingCompany = await devitrakApi.post(
    `/db_company/consulting-company`,
    {
      company_name: companyValue,
    }
  );
  if (checkingExistingCompany.data.company.length > 0) {
    ref.current = {
      ...ref.current,
      companySQL: checkArray(checkingExistingCompany.data.company).company_id,
    };
    return checkArray(checkingExistingCompany.data.company);
  } else {
    const insertingCompanyInfo = await devitrakApi.post(
      "/db_company/new_company",
      {
        company_name: companyValue,
        street_address: props.street,
        city_address: props.city,
        state_address: props.state,
        zip_address: props.postal_code,
        phone_number: props.main_phone,
        email_company: websiteUrl,
        industry: industry,
      }
    );
    if (insertingCompanyInfo.data) {
      ref.current = {
        ...ref.current,
        companySQL: insertingCompanyInfo.data.company.insertId,
      };
      return insertingCompanyInfo.data;
    }
  }
};

export default insertingNewCompanyInSqlDb;
