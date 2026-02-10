// GrayButton.jsx
import { useMemo } from "react";
import { Button } from "antd";
import "./gray_button.css";

/**
 * UntitledUI-like API (without changing your gray background)
 * - size: sm | md | lg | xl
 * - iconLeading / iconTrailing
 * - href (renders like a link-button)
 * - isLoading + showTextWhileLoading
 * - isDisabled
 *
 * Backward compatible:
 * - title, styles, buttonType, func, loadingState, titleStyles, disabled
 */
const GrayButtonComponent = ({
  // ---- New (UntitledUI-like) props ----
  size = "md",
  // iconLeading = null,
  // iconTrailing = null,
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

  // Any extra props go to antd Button
  ...rest
}) => {
  const resolvedDisabled = Boolean(isDisabled ?? disabled);
  const resolvedLoading = Boolean(isLoading ?? loadingState);

  const sizeClass = useMemo(() => {
    switch (size) {
      case "sm":
        return "customized__grayButton--sm";
      case "lg":
        return "customized__grayButton--lg";
      case "xl":
        return "customized__grayButton--xl";
      case "md":
      default:
        return "customized__grayButton--md";
    }
  }, [size]);

  const content = (
    <span className="customized__grayButtonContent">
      {/* {iconLeading ? (
        <span className="customized__grayButtonIcon" data-icon>
          {iconLeading}
        </span>
      ) : null} */}

      {(title || showTextWhileLoading || !resolvedLoading) && (
        <span className="customized__grayButtonText" style={{ ...titleStyles }}>
          {title}
        </span>
      )}

      {/* {iconTrailing ? (
        <span className="customized__grayButtonIcon" data-icon>
          {iconTrailing}
        </span>
      ) : null} */}
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
          onClick={func}
          style={{ ...styles }}
          className={`customized__grayButton ${sizeClass}`}
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
      className={`customized__grayButton ${sizeClass}`}
    >
      {content}
    </Button>
  );
};

export default GrayButtonComponent;
