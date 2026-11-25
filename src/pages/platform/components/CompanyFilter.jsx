import PropTypes from "prop-types";
import { usePlatformCompanies } from "../../../hooks/platform/usePlatformCompanies";
import {
  COMPANY_OPTIONS_LIMIT,
  companyOptionsComplete,
} from "../utils/platformClients";
import ConsoleSelect from "./ConsoleSelect";

// One page, as large as the server will send. React Query caches it under one
// key, so the list screens share a single request.
const ALL_CLIENTS = { page: 1, limit: COMPANY_OPTIONS_LIMIT };

/**
 * "Client: All clients ▾" for the cross-client lists (design boards
 * Inventory, Transactions, Events, People, Audit).
 *
 * While the list is loading, or if it fails, the dropdown holds only "All
 * clients": better a control that does nothing than one that silently offers
 * a short list and makes the operator think those are all the clients there
 * are.
 *
 * The same sentence is why a page the server truncated empties it too. That
 * was a comment making a promise the code could not keep -- we asked for 500
 * clients against a cap of 100 -- so the promise is now a condition.
 */
const CompanyFilter = ({ value, onChange }) => {
  const { rows, total, isLoading, isError } = usePlatformCompanies(ALL_CLIENTS);
  const complete = companyOptionsComplete({ rows, total });
  const companies = isError || !complete ? [] : rows;

  return (
    <ConsoleSelect
      label="Client"
      testId="platform-company-filter"
      value={value}
      disabled={isLoading || companies.length === 0}
      onChange={onChange}
      options={[
        { value: "all", label: "All clients" },
        ...companies.map((company) => ({
          value: String(company.id),
          label: company.name ?? "Unnamed client",
        })),
      ]}
    />
  );
};

CompanyFilter.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default CompanyFilter;
