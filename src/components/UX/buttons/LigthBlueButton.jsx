// LightBlueButton.jsx
import { useMemo } from "react";
import { Button } from "antd";
import "./light_blue_button.css";
import "./styles.css";

/**
 * Untitled UI secondary-color (light blue) button.
 * - size: sm | md | lg | xl
 * - iconTrailing, href, isLoading + showTextWhileLoading, isDisabled
 *
 * Backward compatible: title, styles, buttonType, func, loadingState, titleStyles, disabled
 * Drop-in friendly:    children (used when no title), onClick (used when no func)
 */
const LightBlueButtonComponent = ({
  size = "md",
  iconLeading = null,
  iconTrailing = null,
  href = null,
  target,
  rel,
  ariaLabel,
  isDisabled,
  isLoading,
  showTextWhileLoading = false,

  // ---- Existing props (keep working) ----
  disabled = false,
  title,
  styles = {},
  buttonType = "button",
  func = null,
  loadingState = false,
  titleStyles = {},

  // ---- Drop-in migration props ----
  children,
  onClick,

  // extra props to antd Button if needed
  ...rest
}) => {
  const resolvedDisabled = Boolean(isDisabled ?? disabled);
  const resolvedLoading = Boolean(isLoading ?? loadingState);
  const resolvedOnClick = func ?? onClick;
  const label = children ?? title;

  const sizeClass = useMemo(() => {
    switch (size) {
      case "sm":
        return "customized__lightBlueButton--sm";
      case "lg":
        return "customized__lightBlueButton--lg";
      case "xl":
        return "customized__lightBlueButton--xl";
      case "md":
      default:
        return "customized__lightBlueButton--md";
    }
  }, [size]);

  const content = (
    <span className="customized__lightBlueButtonContent">
      {iconLeading ? (
        <span className="customized__lightBlueButtonIcon" data-icon>
          {iconLeading}
        </span>
      ) : null}

      {(label || showTextWhileLoading || !resolvedLoading) && (
        <span
          className="customized__lightBlueButtonText"
          style={{ ...titleStyles }}
        >
          {label}
        </span>
      )}

      {iconTrailing ? (
        <span className="customized__lightBlueButtonIcon" data-icon>
          {iconTrailing}
        </span>
      ) : null}
    </span>
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel ?? (target === "_blank" ? "noopener noreferrer" : undefined)}
        aria-label={ariaLabel}
        style={{ textDecoration: "none" }}
      >
        <Button
          {...rest}
          disabled={resolvedDisabled || resolvedLoading}
          loading={resolvedLoading}
          htmlType={buttonType}
          onClick={resolvedOnClick}
          style={{ ...styles }}
          className={`customized__lightBlueButton ${sizeClass}`}
        >
          {content}
        </Button>
      </a>
    );
  }

  return (
    <Button
      {...rest}
      aria-label={ariaLabel}
      disabled={resolvedDisabled}
      loading={resolvedLoading}
      htmlType={buttonType}
      onClick={resolvedOnClick}
      style={{ ...styles }}
      className={`customized__lightBlueButton ${sizeClass}`}
    >
      {content}
    </Button>
  );
};

export default LightBlueButtonComponent;
