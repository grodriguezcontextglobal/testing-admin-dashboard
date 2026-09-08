import { Popconfirm } from "antd";
import PropTypes from "prop-types";
import "./styles.css";

/**
 * One button that asks before it acts.
 *
 * There were four copies of this — Blue, Danger, Gray, LightBlue — and they had
 * drifted apart. Every failure below existed in at least one of them:
 *
 *  - **The trigger was allowed to be a submit button.** `buttonType="submit"`
 *    is passed by callers, and it reached the element Popconfirm uses as its
 *    trigger. Clicking it opened the confirmation *and* submitted the form, and
 *    the re-render that followed tore the popup down again — the confirmation
 *    appeared and vanished before anything could be pressed. A button whose
 *    whole job is to defer its action cannot also fire it on the first click,
 *    so the trigger is always `type="button"` and never carries `form`. The
 *    non-confirming branch keeps `buttonType`, so a plain submit button that
 *    passes no `func` still submits.
 *  - **DangerButtonConfirmation had no wrapper element.** Popconfirm needs a
 *    DOM node to anchor to; given a plain function component it warns "Function
 *    components cannot be given refs" and is left without an anchor, which is
 *    what makes a popup mis-place itself and close on the click that opened it.
 *  - **DangerButtonConfirmation used `placement="center"`**, which is not one
 *    of antd's placements, so there was no placement rule to position against.
 *  - **Its disabled/loading gate was commented out**, so a disabled destructive
 *    button still opened a confirmation.
 *  - **`open` was always forwarded**, even as `undefined`. Passing a `open` that
 *    never changes puts Popconfirm in controlled mode and pins it shut; it is
 *    only forwarded now when a caller actually controls it.
 *  - **LightBlueButtonConfirmation imported `./LightBlueButton`**, which does
 *    not exist — the file is spelled `LigthBlueButton` — so the module threw on
 *    import and nothing could use it.
 */
const ConfirmationButton = ({
  ButtonComponent,

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

  // Anything else a caller passes (id, data-testid, form, …).
  ...rest
}) => {
  const resolvedDisabled = Boolean(isDisabled ?? disabled);
  const resolvedLoading = Boolean(isLoading ?? loadingState);
  const shouldConfirm =
    !resolvedDisabled && !resolvedLoading && typeof func === "function";

  const buttonProps = {
    styles,
    title,
    titleStyles,
    size,
    iconLeading,
    iconTrailing,
    href,
    target,
    rel,
    ariaLabel,
    showTextWhileLoading,
  };

  /* Nothing to confirm: a disabled button, a loading one, or one with no action
     of its own. This branch keeps `buttonType`, so a plain submit button that
     was only ever a submit button still submits. */
  if (!shouldConfirm) {
    return (
      <ButtonComponent
        {...rest}
        {...buttonProps}
        buttonType={buttonType}
        func={null}
        disabled={resolvedDisabled}
        loadingState={resolvedLoading}
        isDisabled={resolvedDisabled}
        isLoading={resolvedLoading}
      />
    );
  }

  /* `form` and `buttonType` are deliberately dropped here: the trigger must not
     submit anything on the click that opens the confirmation. */
  const triggerRest = { ...rest };
  delete triggerRest.form;

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
      /* Only forwarded when the caller genuinely controls it — a stray
         `open={undefined}` would otherwise be enough to pin it shut. */
      {...(open === undefined ? {} : { open })}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      {/* A real DOM element, so Popconfirm has something to anchor to. Given a
          function component it cannot attach a ref, and an anchorless popup
          mis-places itself and closes on the click that opened it. */}
      <span style={{ display: "inline-flex", width: "100%" }}>
        <ButtonComponent
          {...triggerRest}
          {...buttonProps}
          buttonType="button"
          func={null}
          disabled={false}
          isDisabled={false}
          loadingState={resolvedLoading}
          isLoading={resolvedLoading}
          styles={{ ...styles, width: "100%" }}
        />
      </span>
    </Popconfirm>
  );
};

ConfirmationButton.propTypes = {
  ButtonComponent: PropTypes.elementType.isRequired,
  disabled: PropTypes.bool,
  title: PropTypes.node,
  styles: PropTypes.object,
  buttonType: PropTypes.string,
  func: PropTypes.func,
  loadingState: PropTypes.bool,
  titleStyles: PropTypes.object,
  size: PropTypes.string,
  iconLeading: PropTypes.node,
  iconTrailing: PropTypes.node,
  href: PropTypes.string,
  target: PropTypes.string,
  rel: PropTypes.string,
  ariaLabel: PropTypes.string,
  isDisabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  showTextWhileLoading: PropTypes.bool,
  confirmationTitle: PropTypes.node,
  confirmationDescription: PropTypes.node,
  okText: PropTypes.node,
  cancelText: PropTypes.node,
  placement: PropTypes.string,
  okButtonProps: PropTypes.object,
  cancelButtonProps: PropTypes.object,
  open: PropTypes.bool,
  onOpenChange: PropTypes.func,
};

export default ConfirmationButton;
