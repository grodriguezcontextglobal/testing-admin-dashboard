import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import "./MultiSelectComponent.css";

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
    if (onSelectionChange) {
      onSelectionChange(newSelection);
    }
  };

  const handleToggleItem = (item) => {
    if (item.disabled) return;
    const newKeys = new Set(selectedKeys);
    if (newKeys.has(item.id)) {
      newKeys.delete(item.id);
    } else {
      newKeys.add(item.id);
    }
    handleSelectionChange(newKeys);
  };

  const handleRemoveItem = (item) => {
    const newKeys = new Set(selectedKeys);
    newKeys.delete(item.id);
    handleSelectionChange(newKeys);
  };

  const handleReset = () => {
    handleSelectionChange(new Set());
    if (onReset) onReset();
  };

  const handleSelectAll = () => {
    const allIds = new Set(items.map((item) => item.id));
    handleSelectionChange(allIds);
    if (onSelectAll) onSelectAll();
  };

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedItems = items.filter(item => selectedKeys.has(item.id));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      className={`multiselect-container ${size} ${disabled ? "disabled" : ""
        }`}
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
            filteredItems.map((item) => (
              <div
                key={item.id}
                className={`multiselect-item ${item.disabled ? "disabled" : ""}`}
                onClick={() => handleToggleItem(item)}
              >
                <input
                  type="checkbox"
                  className="multiselect-item-checkbox"
                  checked={selectedKeys.has(item.id)}
                  disabled={item.disabled}
                  readOnly
                />
                {item.avatarUrl && (
                  <img
                    src={item.avatarUrl}
                    alt={item.label}
                    className="multiselect-item-avatar"
                  />
                )}
                <div className="multiselect-item-content">
                  <span className="multiselect-item-label">{item.label}</span>
                  {item.supportingText && (
                    <span className="multiselect-item-supporting-text">
                      {item.supportingText}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="multiselect-item disabled">No results found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectComponent;
