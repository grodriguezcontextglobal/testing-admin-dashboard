import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PropTypes from "prop-types";
import "./dropdown.css";

// --- Helpers ---
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function getFocusableItems(menuEl) {
  if (!menuEl) return [];
  return Array.from(
    menuEl.querySelectorAll('[role="menuitem"]:not([data-disabled="true"])'),
  );
}

function computePosition(triggerRect, menuRect, placement, offset = 8) {
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  let top = 0;
  let left = 0;

  const isBottom = placement.startsWith("bottom");
  const isTop = placement.startsWith("top");
  const isStart = placement.endsWith("start");
  const isEnd = placement.endsWith("end");

  if (isBottom) top = triggerRect.bottom + offset;
  if (isTop) top = triggerRect.top - menuRect.height - offset;

  if (isStart) left = triggerRect.left;
  if (isEnd) left = triggerRect.right - menuRect.width;

  // Keep within viewport with padding
  const pad = 8;
  left = clamp(left, pad, viewportW - menuRect.width - pad);
  top = clamp(top, pad, viewportH - menuRect.height - pad);

  return { top, left };
}

/**
 * Dropdown Component
 * A highly configurable dropdown that supports both action menus and selectable lists.
 */
export default function Dropdown({
  options = [],
  value,
  defaultValue,
  onChange,
  onSelect,
  placeholder = "Select...",
  label,
  trigger = "button", // "button" | "icon" | "avatar" | "custom"
  renderTrigger,
  renderOption,
  renderValue,
  disabled = false,
  className = "",
  style = {},
  variant = "default", // "default" | "outline" | "ghost" | "primary"
  size = "md", // "sm" | "md" | "lg"
  placement = "bottom-end",
  menuWidth = 240,
  icon,
  avatarSrc,
  avatarAlt = "Avatar",
}) {
  const uid = useId();
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // --- State Management ---
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [pos, setPos] = useState({ top: 0, left: 0, ready: false });

  // Controlled vs Uncontrolled value state
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = isControlled ? value : internalValue;

  const ariaMenuId = useMemo(() => `dropdown-menu-${uid}`, [uid]);

  // --- Actions ---
  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
    requestAnimationFrame(() => triggerRef.current?.focus?.());
  };

  const handleSelect = (option) => {
    if (!option || option.disabled) return;

    // Call generic select handler (useful for action menus)
    if (onSelect) {
      onSelect(option);
    }

    // Call specific option handler
    if (option.onSelect) {
      option.onSelect(option);
    }

    // Handle selection (useful for select-like behavior)
    if (onChange) {
      onChange(option.value !== undefined ? option.value : option);
    }

    if (!isControlled) {
      setInternalValue(option.value !== undefined ? option.value : option);
    }

    close();
  };

  // --- Effects ---

  // Click outside & Escape
  useEffect(() => {
    if (!open) return;

    const onDocMouseDown = (e) => {
      const t = e.target;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      close();
    };

    const onDocKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onDocKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onDocKeyDown);
    };
  }, [open]);

  // Positioning
  useLayoutEffect(() => {
    if (!open) return;

    const update = () => {
      const trig = triggerRef.current;
      const menu = menuRef.current;
      if (!trig || !menu) return;

      const triggerRect = trig.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const { top, left } = computePosition(
        triggerRect,
        menuRect,
        placement,
        8,
      );

      setPos({ top, left, ready: true });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, placement]);

  // Focus management
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      const focusables = getFocusableItems(menuRef.current);
      if (focusables.length) {
        setActiveIndex(0);
        focusables[0].focus();
      }
    });
  }, [open]);

  // --- Data Preparation ---
  const flattened = useMemo(() => {
    const out = [];
    const flatItems = [];

    const pushItem = (item) => {
      // Normalize item to object if string
      const normalized =
        typeof item === "string"
          ? { label: item, value: item, key: item }
          : item;
      // Ensure key
      if (!normalized.key)
        normalized.key =
          normalized.value ?? normalized.label ?? Math.random().toString(36);

      out.push({ type: "item", item: normalized });
      flatItems.push(normalized);
    };

    options.forEach((entry) => {
      if (entry?.type === "separator") {
        out.push({ type: "separator" });
        return;
      }
      if (entry?.type === "section") {
        out.push({ type: "sectionHeader", header: entry.header });
        (entry.items || []).forEach(pushItem);
        return;
      }
      pushItem(entry);
    });

    return { render: out, flatItems };
  }, [options]);

  // --- Keyboard Handlers ---
  const onTriggerKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((v) => !v);
    }
  };

  const onMenuKeyDown = (e) => {
    const focusables = getFocusableItems(menuRef.current);
    if (!focusables.length) return;

    const current = document.activeElement;
    const currentIndex = focusables.indexOf(current);

    const moveTo = (idx) => {
      const next = focusables[clamp(idx, 0, focusables.length - 1)];
      next?.focus();
      setActiveIndex(clamp(idx, 0, focusables.length - 1));
    };

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveTo(currentIndex + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveTo(currentIndex - 1);
        break;
      case "Home":
        e.preventDefault();
        moveTo(0);
        break;
      case "End":
        e.preventDefault();
        moveTo(focusables.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        current?.click?.();
        break;
      default:
        break;
    }
  };

  // --- Render Helpers ---

  // Determine what to show in the trigger
  const displayLabel = useMemo(() => {
    if (label) return label; // Explicit label overrides selection

    // Find selected item label
    if (currentValue !== undefined && currentValue !== null) {
      const selectedOption = flattened.flatItems.find(
        (i) => i.value === currentValue,
      );
      if (selectedOption) return selectedOption.label;
      if (typeof currentValue === "string" || typeof currentValue === "number")
        return currentValue;
    }

    return placeholder;
  }, [label, currentValue, flattened.flatItems, placeholder]);

  const TriggerComponent = () => {
    const commonProps = {
      ref: triggerRef,
      className: `ud-trigger ud-trigger--${size} ud-trigger--variant-${variant} ${disabled ? "is-disabled" : ""} ${className}`,
      "aria-haspopup": "menu",
      "aria-expanded": open,
      "aria-controls": open ? ariaMenuId : undefined,
      onClick: () => !disabled && setOpen((v) => !v),
      onKeyDown: onTriggerKeyDown,
      type: "button",
      style: style,
    };

    if (renderTrigger) {
      return renderTrigger({
        ...commonProps,
        open,
        label: displayLabel,
        value: currentValue,
      });
    }

    if (trigger === "icon") {
      return (
        <button
          {...commonProps}
          className={`${commonProps.className} ud-trigger--icon`}
        >
          <span className="ud-icon">{icon ?? <DotsIcon />}</span>
          <span className="sr-only">{displayLabel}</span>
        </button>
      );
    }

    if (trigger === "avatar") {
      return (
        <button
          {...commonProps}
          className={`${commonProps.className} ud-trigger--avatar`}
        >
          <img className="ud-avatar" src={avatarSrc} alt={avatarAlt} />
        </button>
      );
    }

    // Default Button Trigger
    return (
      <button
        {...commonProps}
        className={`${commonProps.className} ud-trigger--button`}
      >
        {renderValue ? (
          renderValue(currentValue)
        ) : (
          <span className="ud-trigger-label">{displayLabel}</span>
        )}
        <span
          className={`ud-chevron ${open ? "is-open" : ""}`}
          aria-hidden="true"
        >
          <ChevronDown />
        </span>
      </button>
    );
  };

  return (
    <div className="ud-root">
      <TriggerComponent />

      {open && (
        <div
          ref={menuRef}
          id={ariaMenuId}
          className={`ud-menu ${pos.ready ? "is-ready" : ""}`}
          style={{
            top: pos.top,
            left: pos.left,
            width: menuWidth,
            minWidth: triggerRef.current?.offsetWidth,
          }}
          role="menu"
          aria-label={displayLabel}
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
        >
          {flattened.render.map((node, idx) => {
            if (node.type === "separator") {
              return (
                <div
                  key={`sep-${idx}`}
                  className="ud-separator"
                  role="separator"
                />
              );
            }
            if (node.type === "sectionHeader") {
              return (
                <div key={`hdr-${idx}`} className="ud-section-header">
                  {node.header}
                </div>
              );
            }

            const item = node.item;
            const isDisabled = Boolean(item.disabled);
            const isSelected = currentValue === item.value;

            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                data-disabled={isDisabled ? "true" : "false"}
                className={`ud-item ${isDisabled ? "is-disabled" : ""} ${isSelected ? "is-selected" : ""}`}
                onClick={() => handleSelect(item)}
                disabled={false} // Keep focusable
                tabIndex={-1}
              >
                {renderOption ? (
                  renderOption(item, {
                    selected: isSelected,
                    disabled: isDisabled,
                  })
                ) : (
                  <>
                    {item.icon && (
                      <span className="ud-item-icon">{item.icon}</span>
                    )}
                    <span className="ud-item-label">{item.label}</span>
                    {item.addon && (
                      <span className="ud-item-addon">{item.addon}</span>
                    )}
                    {isSelected && (
                      <span className="ud-item-check">
                        <CheckIcon />
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Icons ---
function ChevronDown() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function DotsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 10.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 10.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 10.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      style={{ marginLeft: "auto" }}
    >
      <path
        d="M16.6666 5L7.49992 14.1667L3.33325 10"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// --- PropTypes ---
Dropdown.propTypes = {
  /** Array of options. Can be strings, objects {label, value}, or sections {type:'section', items:[]} */
  options: PropTypes.array,
  /** Controlled value */
  value: PropTypes.any,
  /** Initial value for uncontrolled state */
  defaultValue: PropTypes.any,
  /** Callback when selection changes (value) */
  onChange: PropTypes.func,
  /** Callback when an item is clicked (full option object) */
  onSelect: PropTypes.func,
  /** Placeholder text when no selection */
  placeholder: PropTypes.string,
  /** Explicit label for the trigger button */
  label: PropTypes.node,
  /** Trigger type */
  trigger: PropTypes.oneOf(["button", "icon", "avatar", "custom"]),
  /** Custom trigger renderer function */
  renderTrigger: PropTypes.func,
  /** Custom option renderer function */
  renderOption: PropTypes.func,
  /** Custom value renderer function */
  renderValue: PropTypes.func,
  /** Disable the dropdown */
  disabled: PropTypes.bool,
  /** Additional class names */
  className: PropTypes.string,
  /** Inline styles */
  style: PropTypes.object,
  /** Visual variant */
  variant: PropTypes.oneOf(["default", "outline", "ghost", "primary"]),
  /** Size of the trigger */
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  /** Menu placement */
  placement: PropTypes.oneOf([
    "bottom-end",
    "bottom-start",
    "bottom-center",
    "top-end",
    "top-start",
    "top-center",
  ]),
  /** Width of the dropdown menu */
  menuWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Icon for trigger="icon" */
  icon: PropTypes.node,
  /** Avatar source for trigger="avatar" */
  avatarSrc: PropTypes.string,
  /** Avatar alt text */
  avatarAlt: PropTypes.string,
};
