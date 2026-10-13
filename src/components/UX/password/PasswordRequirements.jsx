import { Check, X } from "lucide-react";
import PropTypes from "prop-types";
import {
  checkPassword,
  passwordStrength,
} from "../../../pages/authentication/utils/passwordPolicy";

const TONE_COLORS = {
  none: "var(--gray-200, #eaecf0)",
  danger: "var(--error-600, #d92d20)",
  warning: "var(--warning-500, #f79009)",
  success: "var(--success-600, #039855)",
};

/**
 * The bar and the checklist under a new-password field. Each rule turns green
 * as it is met, so the person sees what is missing before submitting.
 */
const PasswordRequirements = ({ password, id = "password-requirements" }) => {
  const { rules } = checkPassword(password);
  const { percent, label, tone } = passwordStrength(password);
  const color = TONE_COLORS[tone];

  return (
    <div id={id} style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          role="progressbar"
          aria-label="Password strength"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={label || "Empty"}
          style={{
            flex: 1,
            height: "6px",
            borderRadius: "999px",
            background: TONE_COLORS.none,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${percent}%`,
              height: "100%",
              background: color,
              transition: "width 0.2s ease, background 0.2s ease",
            }}
          />
        </div>
        <span
          style={{
            minWidth: "48px",
            textAlign: "right",
            fontSize: "12px",
            fontWeight: 500,
            color: label ? color : "var(--gray-500, #667085)",
          }}
        >
          {label}
        </span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
        {rules.map((rule) => (
          <li
            key={rule.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              lineHeight: "18px",
              textAlign: "left",
              color: rule.met ? TONE_COLORS.success : "var(--gray-500, #667085)",
            }}
          >
            {rule.met ? (
              <Check size={14} aria-hidden="true" color={TONE_COLORS.success} />
            ) : (
              <X size={14} aria-hidden="true" color="var(--gray-400, #98a2b3)" />
            )}
            <span>
              {rule.label}
              <span style={{ position: "absolute", left: "-9999px" }}>
                {rule.met ? " — met" : " — missing"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

PasswordRequirements.propTypes = {
  password: PropTypes.string,
  id: PropTypes.string,
};

export default PasswordRequirements;
