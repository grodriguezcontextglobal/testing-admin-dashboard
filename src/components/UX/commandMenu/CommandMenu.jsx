import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import "./CommandMenu.css";

/**
 * Untitled UI command menu (⌘K palette): searchable grouped commands with
 * keyboard navigation, plus "search all" scopes for global entity search.
 * Reconstructed after the original was lost to a OneDrive sync failure
 * (original kept as CommandMenu.jsx.onedrive-dead).
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - groups: [{ label, items: [{ id, label, icon, onSelect }] }]
 *  - searchScopes: [{ key, label, icon }]
 *  - onSearchAll: (query, scopeKey|null) => void
 */
const CommandMenu = ({ open, onClose, groups = [], searchScopes = [], onSearchAll }) => {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Navigation/Actions stay visible regardless of what's typed — the query
  // only drives the "Search everywhere/<scope>" entries below, it never
  // hides the static shortcuts (typing a consumer's name used to make every
  // group disappear since none of their labels matched it).
  const filtered = useMemo(() => {
    const rows = [];
    for (const group of groups) {
      const items = group.items || [];
      if (items.length) rows.push({ label: group.label, items });
    }
    return rows;
  }, [groups]);

  const commandCount = useMemo(
    () => filtered.reduce((n, g) => n + g.items.length, 0),
    [filtered]
  );

  const flatItems = useMemo(() => {
    const flat = filtered.flatMap((g) => g.items);
    if (query.trim() && onSearchAll) {
      flat.push({
        id: "__search_all__",
        label: `Search everywhere for "${query.trim()}"`,
        icon: "tabler:search",
        onSelect: () => onSearchAll(query.trim(), null),
      });
      for (const scope of searchScopes) {
        flat.push({
          id: `__search_${scope.key}__`,
          label: `Search ${scope.label} for "${query.trim()}"`,
          icon: scope.icon,
          onSelect: () => onSearchAll(query.trim(), scope.key),
        });
      }
    }
    return flat;
  }, [filtered, query, searchScopes, onSearchAll]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // With Navigation/Actions always visible, default the highlighted row to
  // the first "Search ..." entry while typing — otherwise Enter would keep
  // selecting "Home" (index 0) instead of running the search the user is
  // most likely typing towards.
  useEffect(() => {
    setActiveIndex(query.trim() && onSearchAll ? commandCount : 0);
  }, [query, commandCount, onSearchAll]);

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!open) return null;

  const select = (item) => {
    onClose?.();
    item.onSelect?.();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatItems[activeIndex];
      if (item) select(item);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose?.();
    }
  };

  let runningIndex = -1;

  // Portal to <body>: ancestors with transform/filter (Million-compiled
  // navbar, MUI transitions) turn position:fixed into "fixed relative to
  // that ancestor", which pushed the panel off-viewport on small screens.
  return createPortal(
    <div className="cmdk-overlay" onMouseDown={onClose}>
      <div className="cmdk-panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="cmdk-input-row">
          <Icon icon="tabler:search" width={20} color="var(--gray-500, #777b73)" />
          <input
            ref={inputRef}
            className="cmdk-input"
            placeholder="Search commands, pages, actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <span className="cmdk-kbd">esc</span>
        </div>
        <div className="cmdk-list" ref={listRef}>
          {flatItems.length === 0 && <div className="cmdk-empty">No results found.</div>}
          {filtered.map((group) => (
            <div key={group.label}>
              <div className="cmdk-group-label">{group.label}</div>
              {group.items.map((item) => {
                runningIndex += 1;
                const idx = runningIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="cmdk-item"
                    data-active={idx === activeIndex}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => select(item)}
                  >
                    {item.icon && <Icon icon={item.icon} width={18} />}
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
          {query.trim() && onSearchAll && (
            <div>
              <div className="cmdk-group-label">Search</div>
              {flatItems
                .filter((it) => String(it.id).startsWith("__search"))
                .map((item) => {
                  runningIndex += 1;
                  const idx = runningIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="cmdk-item"
                      data-active={idx === activeIndex}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => select(item)}
                    >
                      {item.icon && <Icon icon={item.icon} width={18} />}
                      {item.label}
                    </button>
                  );
                })}
            </div>
          )}
        </div>
        <div className="cmdk-footer">
          <span>
            <span className="cmdk-kbd">↑</span>
            <span className="cmdk-kbd">↓</span> to navigate
          </span>
          <span>
            <span className="cmdk-kbd">↵</span> to select
          </span>
          <span>
            <span className="cmdk-kbd">esc</span> to close
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CommandMenu;
