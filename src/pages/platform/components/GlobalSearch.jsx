import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Search } from "lucide-react";
import { usePlatformCompanies } from "../../../hooks/platform/usePlatformCompanies";
import { usePlatformList } from "../../../hooks/platform/usePlatformLists";
import { globalSearchGroups, isSearchable } from "../utils/globalSearch";

const PER_GROUP = 5;

/**
 * One box for the whole console (design board Main): clients, serial numbers
 * and people. Three requests, not one — the server has no combined endpoint,
 * and asking each list what it knows keeps the contract the console already
 * has.
 *
 * Every hit leads to the client that holds it. "Where is RX-000007?" is
 * really "whose is it?", and the client profile is where the rest of the
 * answer lives.
 */
const GlobalSearch = () => {
  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");

  // One round of requests per pause in typing, not one per key.
  useEffect(() => {
    const timer = setTimeout(() => setTerm(input), 300);
    return () => clearTimeout(timer);
  }, [input]);

  const enabled = isSearchable(term);
  const query = { search: term, page: 1, limit: PER_GROUP };
  const companies = usePlatformCompanies(query, { enabled });
  const devices = usePlatformList("inventory", query, { enabled });
  const people = usePlatformList("people", { ...query, kind: "members" }, { enabled });

  const groups = enabled
    ? globalSearchGroups({
        companies: companies.rows,
        devices: devices.rows,
        people: people.rows,
      })
    : [];
  const searching =
    enabled && (companies.isFetching || devices.isFetching || people.isFetching);
  const showPanel = enabled && (searching || groups.length > 0 || input.length > 0);

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "460px" }}>
      <div style={{ position: "relative" }}>
        <Search
          size={18}
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--gray-500, #717680)",
          }}
        />
        <input
          type="search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Search clients, serial numbers or consumers"
          aria-label="Search clients, serial numbers or consumers"
          style={{
            width: "100%",
            minHeight: "44px",
            padding: "0 12px 0 38px",
            borderRadius: "var(--radius-md, 8px)",
            border: "1px solid var(--gray-300, #c6c7bb)",
            background: "var(--base-white, #fff)",
            boxShadow: "var(--shadow-xs)",
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            color: "var(--gray-900, #171d1a)",
            boxSizing: "border-box",
          }}
        />
      </div>

      {showPanel && (
        <div
          data-testid="platform-global-search-results"
          style={{
            position: "absolute",
            zIndex: 20,
            marginTop: "6px",
            width: "100%",
            maxHeight: "420px",
            overflowY: "auto",
            borderRadius: "var(--radius-md, 8px)",
            border: "1px solid var(--gray-200, #ddded6)",
            background: "var(--base-white, #fff)",
            boxShadow: "var(--shadow-lg, 0 12px 16px -4px rgba(10,13,18,0.08))",
            padding: "8px",
            boxSizing: "border-box",
          }}
        >
          {groups.length === 0 ? (
            <p
              style={{
                margin: 0,
                padding: "12px",
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                color: "var(--gray-600, #5d615a)",
              }}
            >
              {searching ? "Searching…" : `Nothing matches “${term}”.`}
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.key} style={{ padding: "4px 0" }}>
                <p
                  style={{
                    margin: "0 0 2px",
                    padding: "0 10px",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--gray-500, #717680)",
                  }}
                >
                  {group.label}
                </p>
                {group.items.map((item) => (
                  <Link
                    key={item.id}
                    to={item.to}
                    onClick={() => setInput("")}
                    style={{
                      display: "block",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      textDecoration: "none",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontFamily: "Inter, sans-serif",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--gray-900, #171d1a)",
                      }}
                    >
                      {item.title}
                    </span>
                    {item.subtitle && (
                      <span
                        style={{
                          display: "block",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "13px",
                          color: "var(--gray-600, #5d615a)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.subtitle}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
