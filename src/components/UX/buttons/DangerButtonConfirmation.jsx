import { useMemo } from "react";
import { Popconfirm } from "antd";
import "./styles.css";
import DangerButtonComponent from "./DangerButton";

/**
 * Fixes / improvements:
 * 1) Prevent Popconfirm from opening when the button is disabled or loading.
 * 2) Ensure the click is blocked while loading to avoid double submit.
 * 3) Pass-through UntitledUI-like button props (size, iconLeading, iconTrailing, href, etc.)
 * 4) Make confirmation UX a bit richer (okText/cancelText) and allow placement.
 */
const DangerButtonConfirmationComponent = ({
  // ---- Button props (backward compatible) ----
  disabled = false,
  title,
  styles = {},
  buttonType = "button",
  func = null,
  loadingState = false,
  titleStyles = {},

  // ---- New button API passthrough (from refactor) ----
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
  confirmationDescription, // optional
  okText = "Confirm",
  cancelText = "Cancel",
  placement = "top",
  okButtonProps,
  cancelButtonProps,

  // if you need to control Popconfirm externally
  open,
  onOpenChange,
}) => {
  const resolvedDisabled = Boolean(isDisabled ?? disabled);
  const resolvedLoading = Boolean(isLoading ?? loadingState);

  // If disabled/loading -> do not show Popconfirm at all
  const shouldConfirm = useMemo(
    () => !resolvedDisabled && !resolvedLoading && typeof func === "function",
    [resolvedDisabled, resolvedLoading, func]
  );

  // If disabled/loading, clicking should do nothing and never open Popconfirm.
  if (!shouldConfirm) {
    return (
      <DangerButtonComponent
        disabled={resolvedDisabled}
        loadingState={resolvedLoading}
        buttonType={buttonType}
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
      {/* Keep Popconfirm trigger as a non-disabled element.
          If AntD wraps a disabled button, it won't trigger. We already gate disabled/loading above. */}
      <span style={{ display: "inline-flex", width: "100%" }}>
        <DangerButtonComponent
          disabled={false}
          loadingState={resolvedLoading}
          buttonType={buttonType}
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

export default DangerButtonConfirmationComponent;
