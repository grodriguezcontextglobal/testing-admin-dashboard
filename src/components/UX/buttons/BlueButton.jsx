import { useMemo } from "react";
import { Button } from "antd";
import "./blue_button.css";
import "./styles.css"

/**
 * UntitledUI-like API (without changing your blue background)
 * - size: sm | md | lg | xl
 * - iconLeading / iconTrailing
 * - href (renders like a link-button)
 * - isLoading + showTextWhileLoading
 * - isDisabled
 *
 * Backward compatible:
 * - title, styles, buttonType, func, loadingState, titleStyles
 */
const BlueButtonComponent = ({
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
    // keep your background from .customized__blueButton, only adjust spacing/height
    switch (size) {
      case "sm":
        return "customized__blueButton--sm";
      case "lg":
        return "customized__blueButton--lg";
      case "xl":
        return "customized__blueButton--xl";
      case "md":
      default:
        return "customized__blueButton--md";
    }
  }, [size]);

  const content = (
    <span className="customized__blueButtonContent">
      {/* {iconLeading ? (
        <span className="customized__blueButtonIcon" data-icon>
          {iconLeading}
        </span>
      ) : null} */}

      {(title || showTextWhileLoading || !resolvedLoading) && (
        <span className="customized__blueButtonText" style={{ ...titleStyles }}>
          {title}
        </span>
      )}

      {iconTrailing ? (
        <span className="customized__blueButtonIcon" data-icon>
          {iconTrailing}
        </span>
      ) : null}
    </span>
  );

  // “Hybrid” link-button behavior (UntitledUI style)
  // If you already wrap with <Link>, just ignore href usage.
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
          className={`customized__blueButton ${sizeClass}`}
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
      className={`customized__blueButton ${sizeClass}`}
    >
      {content}
    </Button>
  );
};

export default BlueButtonComponent;
