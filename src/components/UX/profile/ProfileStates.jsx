import { Icon } from "@iconify/react";
import PropTypes from "prop-types";
import "./profileShell.css";

/**
 * Loading and error states, owned by the shell so no page can forget them.
 *
 * The consumer profile previously rendered `undefined` when its query failed —
 * a blank white screen with nothing to read and nothing to click. An error
 * state has to say what broke, whether anything changed, and what to do next.
 */

const BAR_WIDTHS = ["45%", "80%", "62%", "72%", "55%"];

export const ProfileSkeleton = ({ lines, testId }) => (
  <div className="profile-skeleton" data-testid={testId} aria-hidden="true">
    {Array.from({ length: lines }, (_, index) => (
      <span
        // Bars are decorative and positional; index is the only identity.
        key={index}
        className="profile-skeleton__bar"
        style={{ width: BAR_WIDTHS[index % BAR_WIDTHS.length] }}
      />
    ))}
  </div>
);

ProfileSkeleton.propTypes = {
  lines: PropTypes.number,
  testId: PropTypes.string,
};

ProfileSkeleton.defaultProps = {
  lines: 4,
  testId: "profile-skeleton",
};

export const ProfileErrorState = ({ title, description, action, testId }) => (
  <div className="profile-error" role="alert" data-testid={testId}>
    <span className="profile-error__icon">
      <Icon icon="tabler:cloud-off" width={22} />
    </span>
    <p className="profile-error__title">{title}</p>
    {description && <p className="profile-error__description">{description}</p>}
    {action && <div className="profile-error__action">{action}</div>}
  </div>
);

ProfileErrorState.propTypes = {
  title: PropTypes.node,
  description: PropTypes.node,
  action: PropTypes.node,
  testId: PropTypes.string,
};

ProfileErrorState.defaultProps = {
  title: "Couldn't load this section",
  description: "The service didn't respond. Nothing was changed.",
  action: null,
  testId: "profile-error",
};
