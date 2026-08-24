import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";

/**
 * Who is accountable for the device about to be handed over — and, when
 * something is missing, what has to happen before it can be.
 *
 * The three branches lived inside the assignment form as one 130-line function
 * that built its own colour palette per branch with a nested ternary over the
 * consent status. Same four states, same copy, as a component with tones the
 * rest of the app already uses.
 *
 * The states are ordered by how much they block:
 *   blocked   — a minor with no representative on file: nothing can be assigned
 *   consent   — consent is enforced and not (yet) granted
 *   minor     — fine to proceed; the representative signs
 *   adult     — fine to proceed; the member signs
 */
const MemberResponsibilityBanner = ({
  state,
  memberName,
  representativeName,
  representativeEmail,
  representativeLabel,
  consentStatus,
  consentCopy,
  memberUpdateLink,
}) => {
  if (state === "blocked") {
    return (
      <p className="action-form__banner action-form__banner--critical" role="alert">
        <strong>Representative required.</strong> {memberName} is a minor and has
        no complete {representativeLabel} on file. Nothing can be handed over
        until a name and an email are added in{" "}
        <NavLink to={memberUpdateLink}>Details</NavLink>.
      </p>
    );
  }

  if (state === "consent") {
    const tone =
      consentStatus === "agreed"
        ? "success"
        : consentStatus === "refused"
        ? "critical"
        : consentStatus === "pending"
        ? "info"
        : "warning";

    const linkLabel =
      consentStatus === "pending"
        ? "View consent panel"
        : consentStatus === "agreed"
        ? "View consent details"
        : "Update consent";

    return (
      <p className={`action-form__banner action-form__banner--${tone}`} role="alert">
        <strong>Consent: {consentStatus}.</strong> {consentCopy}{" "}
        <NavLink to={memberUpdateLink}>{linkLabel}</NavLink>.
      </p>
    );
  }

  if (state === "minor") {
    return (
      <p className="action-form__banner action-form__banner--info">
        <strong>
          Minor — represented by {representativeName}
        </strong>{" "}
        ({representativeEmail}). The liability contract goes to the
        representative for signature, and responsibility for the device is
        theirs.
      </p>
    );
  }

  return (
    <p className="action-form__banner action-form__banner--neutral">
      <strong>Adult.</strong> {memberName} signs their own liability contract and
      is directly responsible for the device.
    </p>
  );
};

MemberResponsibilityBanner.propTypes = {
  state: PropTypes.oneOf(["blocked", "consent", "minor", "adult"]).isRequired,
  memberName: PropTypes.string,
  representativeName: PropTypes.string,
  representativeEmail: PropTypes.string,
  representativeLabel: PropTypes.string,
  consentStatus: PropTypes.string,
  consentCopy: PropTypes.string,
  memberUpdateLink: PropTypes.string.isRequired,
};

export default MemberResponsibilityBanner;
