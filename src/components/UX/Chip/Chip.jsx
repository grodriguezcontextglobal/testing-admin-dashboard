import styles from "./Chip.module.css";

/**
 * Reusable Chip Component
 * Encapsulates various chip styles used throughout the application.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.label - Content to display inside the chip.
 * @param {('primary'|'secondary'|'success'|'warning'|'error'|'info'|'indigo'|'default'|'clean')} [props.color='default'] - Color theme of the chip.
 * @param {('filled'|'outlined'|'ghost')} [props.variant='filled'] - Visual style variant.
 * @param {('small'|'medium'|'large')} [props.size='medium'] - Size of the chip.
 * @param {boolean} [props.outlined] - Shorthand for variant="outlined".
 * @param {boolean} [props.filled] - Shorthand for variant="filled".
 * @param {function} [props.onClick] - Click handler.
 * @param {function} [props.onDelete] - Delete handler. If provided, a delete icon is shown.
 * @param {boolean} [props.deletable] - Explicitly enable delete icon (requires onDelete).
 * @param {React.ReactNode} [props.icon] - Icon to display before the label.
 * @param {React.ReactNode} [props.avatar] - Avatar to display (alias for icon).
 * @param {boolean} [props.disabled] - Disabled state.
 * @param {string} [props.className] - Custom class name.
 * @param {Object} [props.style] - Custom inline styles.
 */
const Chip = ({
  label,
  color = "default",
  variant = "filled",
  size = "medium",
  outlined = false,
  filled = false,
  onClick,
  onDelete,
  deletable = false,
  icon,
  avatar,
  disabled = false,
  className = "",
  style = {},
  ...rest
}) => {
  // Determine variant (props override default)
  const finalVariant = outlined ? "outlined" : filled ? "filled" : variant;

  // Construct class names
  const classes = [
    styles.chip,
    styles[size],
    styles[`${finalVariant}_${color}`] || styles[color], // Use underscore matching for CSS Modules
    onClick && !disabled ? styles.clickable : "",
    disabled ? styles.disabled : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Handle delete click
  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete && !disabled) {
      onDelete(e);
    }
  };

  // Leading element (Icon or Avatar)
  const leadingElement = icon || avatar;

  return (
    <div
      className={classes}
      onClick={!disabled ? onClick : undefined}
      style={style}
      role={onClick ? "button" : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      aria-disabled={disabled}
      {...rest}
    >
      {leadingElement && <span className={styles.icon}>{leadingElement}</span>}
      <span className={styles.label}>{label}</span>
      {(onDelete || deletable) && (
        <span
          className={styles.deleteIcon}
          onClick={handleDelete}
          role="button"
          tabIndex={0}
          aria-label="Delete"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </div>
  );
};

export default Chip;
