import PropTypes from "prop-types";
import "./CheckboxReusableComponent.css";

const CheckboxReusableComponent = ({
  label,
  hint,
  size = "md",
  checked,
  onChange,
  name,
  disabled = false,
  ...props
}) => {
  const sizeClass = `checkbox-reusable-${size}`;

  return (
    <label
      className={`checkbox-reusable-container ${sizeClass}`}
      htmlFor={name}
      {...props}
    >
      <input
        type="checkbox"
        id={name}
        name={name}
        checked={checked}
        onChange={onChange}
        // `disabled` used to fall into `...props` and land on the <label>,
        // where it does nothing: a "disabled" checkbox stayed clickable.
        disabled={disabled}
        className="checkbox-reusable-input"
      />
      <span className="checkbox-reusable-checkmark"></span>
      <div className="checkbox-reusable-text-container">
        {label && <span className="checkbox-reusable-label">{label}</span>}
        {hint && <p className="checkbox-reusable-hint">{hint}</p>}
      </div>
    </label>
  );
};

CheckboxReusableComponent.propTypes = {
  // Callers pass elements here, not only strings.
  label: PropTypes.node,
  hint: PropTypes.node,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
};

export default CheckboxReusableComponent;
