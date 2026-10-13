import { InputAdornment } from "@mui/material";
import { Eye, EyeOff } from "lucide-react";
import PropTypes from "prop-types";

/* The global `button` rules (index.css padding, the Stripe checkout sheet's
   blue background and full width) reach every button, so each one is reset. */
const buttonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  minWidth: "32px",
  height: "32px",
  padding: 0,
  margin: 0,
  border: "none",
  borderRadius: "50%",
  background: "transparent",
  color: "var(--gray-500, #667085)",
  cursor: "pointer",
  flex: "0 0 auto",
};

/**
 * The eye at the end of a password field. Goes in the input's `endAdornment`;
 * the field switches its `type` from `visible`.
 */
const PasswordVisibilityToggle = ({ visible, onToggle, controls }) => (
  <InputAdornment position="end">
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? "Hide password" : "Show password"}
      aria-pressed={visible}
      aria-controls={controls}
      title={visible ? "Hide password" : "Show password"}
      style={buttonStyle}
    >
      {visible ? (
        <EyeOff size={18} aria-hidden="true" color="var(--gray-500, #667085)" />
      ) : (
        <Eye size={18} aria-hidden="true" color="var(--gray-500, #667085)" />
      )}
    </button>
  </InputAdornment>
);

PasswordVisibilityToggle.propTypes = {
  visible: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  controls: PropTypes.string,
};

export default PasswordVisibilityToggle;
