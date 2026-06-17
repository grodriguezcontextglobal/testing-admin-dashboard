import { useState, useEffect, useRef } from "react";
import React from "react";
import { Icon } from "@iconify/react";
import "./MultiSelectComponent.css";

// ─── MultiSelect.Item ─────────────────────────────────────────────────────────
// Compound sub-component rendered inside the dropdown for each item.
// `selected` and `onClick` are injected by the parent via React.cloneElement.

const MultiSelectItem = ({
  // id,
  children,
  supportingText,
  selectionIndicator = "checkbox",
  selectionIndicatorAlign = "left",
  avatarUrl,
  disabled = false,
  selected = false,
  onClick,
}) => {
  const checkboxEl = selectionIndicator === "checkbox" ? (
    <input
      type="checkbox"
      className={`multiselect-item-checkbox${selectionIndicatorAlign === "right" ? " multiselect-item-checkbox--right" : ""}`}
      checked={selected}
      disabled={disabled}
      readOnly
    />
  ) : null;

  return (
    <div
      className={`multiselect-item${disabled ? " disabled" : ""}${selected ? " selected" : ""}`}
      onClick={!disabled ? onClick : undefined}
    >
      {selectionIndicatorAlign === "left" && checkboxEl}
      {avatarUrl && (
        <img src={avatarUrl} alt={String(children)} className="multiselect-item-avatar" />
      )}
      <div className="multiselect-item-content">
        <span className="multiselect-item-label">{children}</span>
        {supportingText && (
          <span className="multiselect-item-supporting-text">{supportingText}</span>
        )}
      </div>
      {selectionIndicatorAlign === "right" && checkboxEl}
    </div>
  );
};

// ─── MultiSelect ──────────────────────────────────────────────────────────────

const MultiSelectComponent = ({
  size = "md",
  label,
  tooltip,
  hint,
  placeholder = "Select options",
  items = [],
  selectedKeys: initialSelectedKeys = new Set(),
  onSelectionChange,
  supportingText,
  onReset,
  onSelectAll,
  isRequired,
  disabled,
  children, // render prop: (item) => <MultiSelectComponent.Item ...>
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKeys, setSelectedKeys] = useState(initialSelectedKeys);
  const containerRef = useRef(null);

  useEffect(() => {
    setSelectedKeys(initialSelectedKeys);
  }, [initialSelectedKeys]);

  const handleSelectionChange = (newSelection) => {
    setSelectedKeys(newSelection);
    if (onSelectionChange) onSelectionChange(newSelection);
  };

  const handleToggleItem = (item) => {
    if (item.disabled) return;
    const next = new Set(selectedKeys);
    if (next.has(item.id)) {
      next.delete(item.id);
    } else {
      next.add(item.id);
    }
    handleSelectionChange(next);
  };

  const handleRemoveItem = (item) => {
    const next = new Set(selectedKeys);
    next.delete(item.id);
    handleSelectionChange(next);
  };

  const handleReset = (e) => {
    e?.stopPropagation();
    handleSelectionChange(new Set());
    if (onReset) onReset();
  };

  const handleSelectAll = (e) => {
    e?.stopPropagation();
    const allIds = new Set(items.map((item) => item.id));
    handleSelectionChange(allIds);
    if (onSelectAll) onSelectAll();
  };

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedItems = items.filter((item) => selectedKeys.has(item.id));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderDropdownItem = (item) => {
    if (typeof children === "function") {
      const rendered = children(item);
      return React.cloneElement(rendered, {
        key: item.id,
        selected: selectedKeys.has(item.id),
        onClick: () => handleToggleItem(item),
        disabled: item.disabled || rendered.props.disabled,
      });
    }
    // Fallback: default rendering when no render prop is provided
    return (
      <MultiSelectItem
        key={item.id}
        id={item.id}
        selected={selectedKeys.has(item.id)}
        onClick={() => handleToggleItem(item)}
        disabled={item.disabled}
        avatarUrl={item.avatarUrl}
        supportingText={item.supportingText}
      >
        {item.label}
      </MultiSelectItem>
    );
  };

  return (
    <div
      className={`multiselect-container ${size}${disabled ? " disabled" : ""}`}
      ref={containerRef}
    >
      <div className="label-wrapper">
        {label && (
          <label className="multiselect-label">
            {label}
            {isRequired && <span className="required-asterisk">*</span>}
          </label>
        )}
        {tooltip && (
          <span className="tooltip-icon" data-tooltip={tooltip}>
            <Icon icon="heroicons:question-mark-circle" />
          </span>
        )}
      </div>

      <div
        className="multiselect-input-wrapper"
        onClick={() => !disabled && setIsOpen(true)}
      >
        <div className="tags-container">
          {selectedItems.map((item) => (
            <div key={item.id} className="multiselect-tag">
              {item.avatarUrl && (
                <img
                  src={item.avatarUrl}
                  alt={item.label}
                  className="multiselect-tag-avatar"
                />
              )}
              <span>{item.label}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveItem(item);
                }}
                className="multiselect-tag-remove"
              >
                <Icon icon="heroicons:x-mark" />
              </button>
            </div>
          ))}
        </div>
        <input
          type="text"
          className="multiselect-input"
          placeholder={selectedItems.length === 0 ? placeholder : ""}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
        />
        <div className="multiselect-actions">
          {selectedKeys.size > 0 && (
            <button className="reset-button" onClick={handleReset}>
              <Icon icon="heroicons:x-mark" />
            </button>
          )}
          <span className="dropdown-arrow">
            <Icon icon="heroicons:chevron-up-down" />
          </span>
        </div>
      </div>

      {(hint || supportingText) && (
        <div className="hint-wrapper">
          {hint && <p className="multiselect-hint">{hint}</p>}
          {supportingText && (
            <p className="multiselect-supporting-text">{supportingText}</p>
          )}
        </div>
      )}

      {isOpen && !disabled && (
        <div className="multiselect-dropdown">
          <div className="dropdown-actions">
            <button onClick={handleSelectAll}>Select all</button>
            <button onClick={handleReset}>Reset</button>
          </div>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => renderDropdownItem(item))
          ) : (
            <div className="multiselect-item disabled">No results found</div>
          )}
        </div>
      )}
    </div>
  );
};

MultiSelectComponent.Item = MultiSelectItem;

export default MultiSelectComponent;
