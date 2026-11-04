import { groupBy } from "lodash";

/**
 * The filter-select options when the server does not paginate: the distinct
 * values of each field across the rows in memory, keyed by the select's
 * category index (see facetsToFilterOptions for the paginated path).
 *
 * Index 6 (Staff member) is gone: it was the one list not derived from the
 * data (it came from companyData.employees) and it filtered on
 * `assignedToStaffMember`, which is null on every row because warehouse-items
 * has no `usage` column. Every name in it matched nothing.
 */
const FIELD_BY_CATEGORY = Object.freeze({
  0: "brand",
  1: "item_group",
  2: "serial_number",
  3: "location",
  4: "ownership",
  5: "status",
  7: "logistic_status",
  8: "category_name",
});

export const datasetToFilterOptions = (rows) => {
  const options = {};
  for (const [index, field] of Object.entries(FIELD_BY_CATEGORY)) {
    options[index] = Object.keys(groupBy(rows, field));
  }
  return options;
};
