import PropTypes from "prop-types";
import "./profileShell.css";

/**
 * The layout both profile pages render into: breadcrumb → identity → at a
 * glance → tabs → content.
 *
 * The shell knows nothing about students or consumers. Whoever renders it
 * decides what goes in each slot; the spacing, order and responsive behaviour
 * are the same either way, which is the whole point — the two pages had drifted
 * into two different visual languages for the same object (a person and the
 * gear they're holding).
 */
const ProfileShell = ({ breadcrumb, identity, stats, tabs, children, testId }) => (
  <div className="profile-shell" data-testid={testId}>
    {breadcrumb}
    {identity}
    {stats}
    {tabs}
    {children}
  </div>
);

ProfileShell.propTypes = {
  breadcrumb: PropTypes.node,
  identity: PropTypes.node,
  stats: PropTypes.node,
  tabs: PropTypes.node,
  children: PropTypes.node,
  testId: PropTypes.string,
};

ProfileShell.defaultProps = {
  breadcrumb: null,
  identity: null,
  stats: null,
  tabs: null,
  children: null,
  testId: "profile-shell",
};

export default ProfileShell;
