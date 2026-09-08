import { Icon } from "@iconify/react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { usePermission } from "../../../hooks/usePermission";
import "./consentEnforcement.css";

/** Where the setting lives. Guarded by PermissionGuard action="member:update". */
export const SCHOOL_COMPLIANCE_PATH = "/profile/school-compliance";

/**
 * What consent enforcement is, and how to switch it on.
 *
 * The dashboard reported the setting as a grey pill reading "Consent
 * enforcement off" and stopped there. That is the state in which the coverage
 * tile reads nothing and the attention list stays empty, so it is exactly the
 * state that has to explain itself — what enforcement does, that it is a
 * setting rather than a fact, and where to change it.
 *
 * The link is gated on `member:update`, the same permission the route guard
 * and the settings page itself use, so it is never offered to somebody who
 * would only be redirected away. Whoever cannot change it is told who can.
 */
const ConsentEnforcementCallout = ({
  enforcementOn,
  requiredPolicyVersion,
  audienceLabel = "students",
}) => {
  const canManage = usePermission("member:update");
  const singular = audienceLabel.replace(/s$/, "");

  if (enforcementOn) {
    return (
      <div className="consent-enforcement">
        <Icon
          className="consent-enforcement__icon"
          icon="tabler:shield-check"
          width={18}
        />
        <div className="consent-enforcement__body">
          <p className="consent-enforcement__title">
            Consent enforcement is on
            {requiredPolicyVersion ? ` · policy v${requiredPolicyVersion}` : ""}
          </p>
          <p className="consent-enforcement__text">
            A minor cannot be assigned a device until their guardian has agreed
            to{" "}
            {requiredPolicyVersion
              ? `policy v${requiredPolicyVersion}`
              : "the current policy"}
            . Everything below counts against that rule.
          </p>
          {!requiredPolicyVersion && (
            <p className="consent-enforcement__text">
              No required policy version is set, so an agreement to any version
              counts and nobody is ever asked to re-consent.
            </p>
          )}
          {canManage && (
            <Link className="consent-enforcement__action" to={SCHOOL_COMPLIANCE_PATH}>
              Manage in School compliance →
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="consent-enforcement consent-enforcement--off">
      <Icon
        className="consent-enforcement__icon"
        icon="tabler:shield-off"
        width={18}
      />
      <div className="consent-enforcement__body">
        <p className="consent-enforcement__title">Consent enforcement is off</p>
        <p className="consent-enforcement__text">
          Nobody is blocked from receiving a device, so the figures below are not
          being applied to anything. Turn enforcement on and a minor cannot be
          assigned a device until their guardian has agreed to the current
          policy — which is what FERPA and, for anyone under 13, COPPA expect
          you to be able to show.
        </p>
        {canManage ? (
          <Link className="consent-enforcement__action" to={SCHOOL_COMPLIANCE_PATH}>
            Turn it on in School compliance →
          </Link>
        ) : (
          <p className="consent-enforcement__where">
            It is switched on under <strong>Profile → School compliance</strong>,
            which needs an administrator. Ask whoever manages {singular} records
            for your school.
          </p>
        )}
      </div>
    </div>
  );
};

ConsentEnforcementCallout.propTypes = {
  enforcementOn: PropTypes.bool,
  requiredPolicyVersion: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  audienceLabel: PropTypes.string,
};

export default ConsentEnforcementCallout;
