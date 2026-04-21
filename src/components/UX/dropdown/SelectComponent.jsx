import { useState, useEffect, useRef } from "react";
import "./SelectComponent.css";

const SelectComponent = ({
  label,
  hint,
  placeholder = "Select an option",
  items = [],
  onSelect,
  value,
  isRequired,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);

  const getLabel = (item) => {
    if (typeof item === "object" && item !== null) {
      return item.label || "";
    }
    return item || "";
  };

  const getValue = (item) => {
    if (typeof item === "object" && item !== null) {
      return item.id || item.value;
    }
    return item;
  };

  useEffect(() => {
    if (value) {
      const initialLabel = getLabel(value);
      setSearchTerm(initialLabel);
    } else {
      setSearchTerm("");
    }
  }, [value]);

  const filteredItems = items.filter((item) => {
    const label = getLabel(item);
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleInputChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    if (!isOpen) {
      setIsOpen(true);
    }
    if (newSearchTerm === "" && onSelect) {
      onSelect(null);
    }
  };

  const handleItemClick = (item) => {
    if (typeof item === "object" && item.disabled) return;
    setSearchTerm(getLabel(item));
    setIsOpen(false);
    if (onSelect) {
      onSelect(item);
    }
  };

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
    <div className="select-container" ref={containerRef}>
      {label && (
        <label className="select-label">
          {label}
          {isRequired && <span>*</span>}
        </label>
      )}
      <div className="select-input-wrapper">
        <input
          type="text"
          className="select-input"
          placeholder={placeholder}
          value={searchTerm}
          onClick={() => setIsOpen(!isOpen)}
          onChange={handleInputChange}
        />
      </div>
      {hint && <p className="select-hint">{hint}</p>}
      {isOpen && (
        <div className="select-dropdown">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              return <div
                key={getValue(item)}
                className={`select-item ${typeof item === "object" && item.disabled ? "disabled" : ""}`}
                onClick={() => handleItemClick(item)}
              >
                <span className="item-label">{getLabel(item)}</span>
                {typeof item === "object" && item.supportingText && (
                  <span className="item-supporting-text">
                    {item.supportingText}
                  </span>
                )}
              </div>

            })
          ) : (
            <div className="select-item disabled">No results found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SelectComponent;
