import PropTypes from "prop-types";
import { usePlatformCompanies } from "../../../hooks/platform/usePlatformCompanies";
import ConsoleSelect from "./ConsoleSelect";

// One page, large enough to hold every client. React Query caches it under
// one key, so the five list screens share a single request.
const ALL_CLIENTS = { page: 1, limit: 500 };

/**
 * "Client: All clients ▾" for the cross-client lists (design boards
 * Inventory, Transactions, Events, People, Audit).
 *
 * While the list is loading, or if it fails, the dropdown holds only "All
 * clients": better a control that does nothing than one that silently offers
 * a short list and makes the operator think those are all the clients there
 * are.
 */
const CompanyFilter = ({ value, onChange }) => {
  const { rows, isLoading, isError } = usePlatformCompanies(ALL_CLIENTS);
  const companies = isError ? [] : rows;

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
