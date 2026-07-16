import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { getIndustryProfile } from "../../config/industryProfiles";
import PropTypes from "prop-types";

/**
 * Route guard for nav sections an industry profile hides (e.g. Consumers is
 * hidden for Education — students are the consumers there). Redirects home
 * when the company's industry doesn't use the section, so deep links and
 * stale sessions can't reach it either.
 */
const IndustryTabGuard = ({ tab }) => {
  const { user } = useSelector((state) => state.admin);
  const hidden = getIndustryProfile(user?.companyData?.industry).hiddenNavTabs;
  if (hidden.includes(tab)) return <Navigate to="/" replace />;
  return <Outlet />;
};

IndustryTabGuard.propTypes = { tab: PropTypes.string.isRequired };

export default IndustryTabGuard;
