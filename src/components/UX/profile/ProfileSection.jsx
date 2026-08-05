import PropTypes from "prop-types";
import "./profileShell.css";

/**
 * A titled panel inside a profile. The count lives in the heading — "Assigned
 * devices (3)" tells you the size of the thing before you've read a single row.
 */
const ProfileSection = ({ title, count, description, actions, children, testId }) => (
  <section className="profile-section" data-testid={testId}>
    {(title || actions) && (
      <div className="profile-section__head">
        <div>
          {title && (
            <h2 className="profile-section__title">
              {title}
              {typeof count === "number" ? ` (${count})` : ""}
            </h2>
          )}
          {description && (
            <p className="profile-section__description">{description}</p>
          )}
        </div>
        {actions && <div className="profile-section__actions">{actions}</div>}
      </div>
    )}
    <div className="profile-section__body">{children}</div>
  </section>
);

ProfileSection.propTypes = {
  title: PropTypes.node,
  count: PropTypes.number,
  description: PropTypes.node,
  actions: PropTypes.node,
  children: PropTypes.node,
  testId: PropTypes.string,
};

ProfileSection.defaultProps = {
  title: null,
  count: undefined,
  description: null,
  actions: null,
  children: null,
  testId: "profile-section",
};

export default ProfileSection;
