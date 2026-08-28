import { useSelector } from "react-redux";
import { assignableTargetsLabel } from "../../../../config/industryProfiles";

/**
 * The company's own phrase for who a device can be assigned to.
 *
 * A one-line hook rather than a prop threaded through six form components: the
 * answer depends only on the company's industry, which every one of them can
 * read for itself, and passing it down would mean touching every caller of
 * `renderFields` including the ones that never show the field.
 */
export const useAssignableTargets = () => {
  const { user } = useSelector((state) => state.admin);
  return assignableTargetsLabel(user?.companyData?.industry);
};

export default useAssignableTargets;
