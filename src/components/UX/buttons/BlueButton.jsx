import { useMemo } from "react";
import { Button } from "antd";
import inferButtonIcons from "./inferButtonIcon";
import "./blue_button.css";
import "./styles.css";

/**
 * Untitled UI primary button.
 * - size: sm | md | lg | xl
 * - iconTrailing, href, isLoading + showTextWhileLoading, isDisabled
 *
 * Backward compatible: title, styles, buttonType, func, loadingState, titleStyles, disabled
 * Drop-in friendly:    children (used when no title), onClick (used when no func)
 */
const BlueButtonComponent = ({
  size = "md",
  icon = null, // legacy antd-style prop — folded into iconLeading (never both)
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

  // Any extra props go to antd Button (e.g., id, data-testid)
  ...rest
}) => {
  const resolvedDisabled = Boolean(isDisabled ?? disabled);
  const resolvedLoading = Boolean(isLoading ?? loadingState);
  const resolvedOnClick = func ?? onClick;
  const label = children ?? title;

  // Contextual icon from the label (Untitled UI pattern) unless the caller
  // passed explicit icons. String labels only — JSX labels are left alone.
  const inferred =
    !iconLeading && !icon && !iconTrailing ? inferButtonIcons(label) : null;
  const effIconLeading = iconLeading ?? icon ?? inferred?.leading ?? null;
  const effIconTrailing = iconTrailing ?? inferred?.trailing ?? null;

  const sizeClass = useMemo(() => {
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
      {effIconLeading ? (
        <span className="customized__blueButtonIcon" data-icon>
          {effIconLeading}
        </span>
      ) : null}

      {(label || showTextWhileLoading || !resolvedLoading) && (
        <span className="customized__blueButtonText" style={{ ...titleStyles }}>
          {label}
        </span>
      )}

      {effIconTrailing ? (
        <span className="customized__blueButtonIcon" data-icon>
          {effIconTrailing}
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
      onClick={resolvedOnClick}
      style={{ ...styles }}
      className={`customized__blueButton ${sizeClass}`}
    >
      {content}
    </Button>
  );
};

export default BlueButtonComponent;
