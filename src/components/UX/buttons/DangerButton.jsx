import { useMemo } from "react";
import { Button } from "antd";
import "./danger_button.css";
import "./styles.css"
/**
 * UntitledUI-like API (without changing your danger background)
 * - size: sm | md | lg | xl
 * - iconLeading / iconTrailing
 * - href (renders like a link-button)
 * - isLoading + showTextWhileLoading
 * - isDisabled
 *
 * Backward compatible:
 * - title, styles, buttonType, func, loadingState, titleStyles, disabled
 */
const DangerButtonComponent = ({
  // ---- New (UntitledUI-like) props ----
  size = "md", // "sm" | "md" | "lg" | "xl"
  // iconLeading = null,
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

  // Any extra props go to antd Button (e.g., id, data-testid)
  ...rest
}) => {
  const resolvedDisabled = Boolean(isDisabled ?? disabled);
  const resolvedLoading = Boolean(isLoading ?? loadingState);

  const sizeClass = useMemo(() => {
    switch (size) {
      case "sm":
        return "customized__dangerButton--sm";
      case "lg":
        return "customized__dangerButton--lg";
      case "xl":
        return "customized__dangerButton--xl";
      case "md":
      default:
        return "customized__dangerButton--md";
    }
  }, [size]);

  const content = (
    <span className="customized__dangerButtonContent">
      {/* {iconLeading ? (
        <span className="customized__dangerButtonIcon" data-icon>
          {iconLeading}
        </span>
      ) : null} */}

      {(title || showTextWhileLoading || !resolvedLoading) && (
        <span className="customized__dangerButtonText" style={{ ...titleStyles }}>
          {title}
        </span>
      )}

      {iconTrailing ? (
        <span className="customized__dangerButtonIcon" data-icon>
          {iconTrailing}
        </span>
      ) : null}
    </span>
  );

  // “Hybrid” link-button behavior (UntitledUI style)
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
          onClick={func}
          style={{ ...styles }}
          className={`customized__dangerButton ${sizeClass}`}
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
      onClick={func}
      style={{ ...styles }}
      className={`customized__dangerButton ${sizeClass}`}
    >
      {content}
    </Button>
  );
};

export default DangerButtonComponent;
