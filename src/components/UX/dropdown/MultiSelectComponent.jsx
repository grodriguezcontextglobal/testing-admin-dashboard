import { useState, useEffect, useRef } from "react";
import "./MultiSelectComponent.css";

const MultiSelectComponent = ({
  label,
  hint,
  placeholder = "Search...",
  items = [],
  value = [],
  onChange,
  isRequired,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);

  const getItemId = (item) => item.id || item.value;

  const handleToggleItem = (item) => {
    if (item.disabled) return;
    const isSelected = value.some(
      (selected) => getItemId(selected) === getItemId(item),
    );
    const newSelection = isSelected
      ? value.filter((selected) => getItemId(selected) !== getItemId(item))
      : [...value, item];
    onChange(newSelection);
  };

  const handleRemoveItem = (item) => {
    const newSelection = value.filter(
      (selected) => getItemId(selected) !== getItemId(item),
    );
    onChange(newSelection);
  };

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
    <div className="multiselect-container" ref={containerRef}>
      {label && (
        <label className="multiselect-label">
          {label}
          {isRequired && <span>*</span>}
        </label>
      )}
      <div
        className="multiselect-input-wrapper"
        onClick={() => setIsOpen(true)}
      >
        {value.map((item) => (
          <div key={getItemId(item)} className="multiselect-tag">
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
              &times;
            </button>
          </div>
        ))}
        <input
          type="text"
          className="multiselect-input"
          placeholder={value.length === 0 ? placeholder : ""}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
        />
      </div>
      {hint && <p className="multiselect-hint">{hint}</p>}
      {isOpen && (
        <div className="multiselect-dropdown">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                key={getItemId(item)}
                className={`multiselect-item ${item.disabled ? "disabled" : ""}`}
                onClick={() => handleToggleItem(item)}
              >
                <input
                  type="checkbox"
                  className="multiselect-item-checkbox"
                  checked={value.some(
                    (selected) => getItemId(selected) === getItemId(item),
                  )}
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
