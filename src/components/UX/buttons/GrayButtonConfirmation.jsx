// GrayButtonConfirmation.jsx
import { useMemo } from "react";
import { Popconfirm } from "antd";
import "./styles.css";
import GrayButtonComponent from "./GrayButton";

/**
 * Fixes / improvements:
 * 1) Popconfirm never opens when disabled/loading
 * 2) Avoid Popconfirm wrapping disabled element (AntD won’t trigger)
 * 3) Uses the new GrayButtonComponent (keeps consistent styling/background)
 * 4) Pass-through UntitledUI-like button props + richer Popconfirm props
 */
const GrayButtonConfirmationComponent = ({
  // ---- Button props (backward compatible) ----
  disabled = false,
  title,
  styles = {},
  buttonType = "button",
  func = null,
  loadingState = false,
  titleStyles = {},

  // ---- New button API passthrough ----
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

  // ---- Popconfirm props ----
  confirmationTitle = "Are you sure?",
  confirmationDescription,
  okText = "Confirm",
  cancelText = "Cancel",
  placement = "top",
  okButtonProps,
  cancelButtonProps,
  open,
  onOpenChange,
}) => {
  const resolvedDisabled = Boolean(isDisabled ?? disabled);
  const resolvedLoading = Boolean(isLoading ?? loadingState);

  const shouldConfirm = useMemo(
    () => !resolvedDisabled && !resolvedLoading && typeof func === "function",
    [resolvedDisabled, resolvedLoading, func]
  );

  // If disabled/loading -> render plain button (no confirm)
  if (!shouldConfirm) {
    return (
      <GrayButtonComponent
        disabled={resolvedDisabled}
        loadingState={resolvedLoading}
        buttonType={buttonType}
        func={null}
        styles={styles}
        title={title}
        titleStyles={titleStyles}
        size={size}
        iconLeading={iconLeading}
        iconTrailing={iconTrailing}
        href={href}
        target={target}
        rel={rel}
        ariaLabel={ariaLabel}
        isDisabled={resolvedDisabled}
        isLoading={resolvedLoading}
        showTextWhileLoading={showTextWhileLoading}
      />
    );
  }

  return (
    <Popconfirm
      title={confirmationTitle}
      description={confirmationDescription}
      onConfirm={func}
      okText={okText}
      cancelText={cancelText}
      placement={placement}
      okButtonProps={okButtonProps}
      cancelButtonProps={cancelButtonProps}
      open={open}
      onOpenChange={onOpenChange}
    >
      {/* Wrap in span so Popconfirm has a stable trigger element */}
      <span style={{ display: "inline-flex", width: "100%" }}>
        <GrayButtonComponent
          disabled={false}
          loadingState={resolvedLoading}
          buttonType={buttonType}
          func={null} // Popconfirm handles confirm; we don't want click to run func immediately
          styles={styles}
          title={title}
          titleStyles={titleStyles}
          size={size}
          iconLeading={iconLeading}
          iconTrailing={iconTrailing}
          href={href}
          target={target}
          rel={rel}
          ariaLabel={ariaLabel}
          isDisabled={false}
          isLoading={resolvedLoading}
          showTextWhileLoading={showTextWhileLoading}
        />
      </span>
    </Popconfirm>
  );
};

export default GrayButtonConfirmationComponent;
