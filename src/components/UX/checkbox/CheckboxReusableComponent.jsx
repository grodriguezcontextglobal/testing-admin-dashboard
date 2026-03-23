import PropTypes from "prop-types";
import "./CheckboxReusableComponent.css";

const CheckboxReusableComponent = ({
  label,
  hint,
  size = "md",
  checked,
  onChange,
  name,
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
  label: PropTypes.string,
  hint: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
};

export default CheckboxReusableComponent;
